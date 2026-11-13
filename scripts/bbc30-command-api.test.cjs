// Actual tRPC router + real Discord error mapping; synthetic fetch/account only.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { initTRPC, TRPCError } = require('@trpc/server');
const root = path.resolve(__dirname,'..');
const plain = value => JSON.parse(JSON.stringify(value));
const session = {user:{id:'owner',discordId:'discord-owner'}};
const input = {guildId:'guild',commandId:'local'};
const overrides = [{id:'old-role',type:1,permission:true},{id:'user',type:2,permission:false},{id:'channel',type:3,permission:true}];
function load(source, deps, globals={}) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {exports,...globals,require(id){if(Object.hasOwn(deps,id))return deps[id];throw Error('Forbidden import: '+id);}});
  return exports;
}
const source = file => fs.readFileSync(path.join(root,file),'utf8');
function fixture(options={}) {
  const trace=[], accountQueries=[], activity=[];
  const env={DISCORD_CLIENT_ID:'app',DISCORD_TOKEN:'fixture-bot'};
  const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>{
    if(options.invalidJSON)throw Error('invalid JSON');return body;
  }});
  const discord=load(source('packages/api/src/discord.ts'),{'@trpc/server':{TRPCError}},{globalThis:{fetch:async(url,init)=>{
    trace.push({url,init});
    if(options.network)throw Error('offline');
    if(url.includes('/users/@me/guilds?'))return response(200,[{id:'guild',owner:true}]);
    if(url.endsWith('/commands')) {
      if(options.listStatus)return response(options.listStatus,{code:10066,message:'list failure'});
      return response(200,url.includes('/guilds/')?[{id:'local',name:'play',type:1}]:[
        {id:'shadowed',name:'play',type:1},{id:'global',name:'ping',type:1},{id:'context',name:'play',type:2}
      ]);
    }
    if(url.endsWith('/permissions')) {
      if(init.method==='PUT')return response(options.putStatus??200,options.putStatus?{message:'write failure',code:10066}:{id:input.commandId,application_id:'app',guild_id:'guild',...JSON.parse(init.body)});
      return response(options.permissionStatus??200,options.permissionStatus?{code:options.discordCode,message:'permission failure'}:{id:input.commandId,application_id:'app',guild_id:'guild',permissions:overrides});
    }
    if(url.endsWith('/roles')||url.endsWith('/channels'))return response(200,[]);
    return response(options.detailStatus??200,{id:url.split('/').pop(),name:'play',code:10066});
  }}});
  const management=load(source('packages/api/src/commandManagement.ts'),{'@trpc/server':{TRPCError},'./discord':discord},{process:{env}});
  const guildAccess=load(source('packages/api/src/guildAccess.ts'),{'@trpc/server':{TRPCError},'./discord':discord});
  const permissions=load(source('packages/api/src/commandPermissions.ts'),{});
  const dashboardActivity=load(source('packages/api/src/dashboardActivity.ts'),{'@trpc/server':{TRPCError}});
  const router=load(source('packages/api/src/routers/command.ts'),{'../trpc':{t:initTRPC.context().create()},zod:require('zod'),'@trpc/server':{TRPCError},
    '../discord':discord,'../commandManagement':management,'../commandPermissions':permissions,'../guildAccess':guildAccess,
    '../dashboardActivity':dashboardActivity},{process:{env}}).commandRouter;
  const prisma={account:{findUnique:async q=>{accountQueries.push(q);return options.expired?null:{userId:'owner',access_token:'fixture-oauth'};}},
    guild:{findUnique:async()=>({disabledCommands:[]}),update:async args=>args},
    dashboardActivity:{create:async ({data})=>{
      if(options.activityFailure)throw Error('Fixture write failure');
      activity.push(plain(data));
    }}};
  return {caller:router.createCaller({session:options.anonymous?null:session,prisma}),trace,accountQueries,activity};
}
test('scope collisions, same-name different type, command ID validation and response shapes',async()=>{
  const f=fixture();
  const list=await f.caller.getCommands({guildId:'guild'});
  assert.deepEqual(plain(list.commands),[
    {id:'local',name:'play',type:1,scope:'guild',toggleSupported:true},
    {id:'global',name:'ping',type:1,scope:'global',toggleSupported:false},
    {id:'context',name:'play',type:2,scope:'global',toggleSupported:false}
  ]);
  for(const commandId of ['local','global','context']) {
    const detail=await f.caller.getCommandAndGuildChannels({...input,commandId});
    assert.deepEqual(Object.keys(detail),['channels','roles','command','permissions']);
    assert.equal(detail.command.id,commandId);
    assert.ok(f.trace.some(c=>c.url.endsWith(commandId==='local'?'/guilds/guild/commands/local':'/applications/app/commands/'+commandId)));
  }
  for(const commandId of ['shadowed','missing']) await assert.rejects(f.caller.getCommandPermissions({...input,commandId}),{
    code:'NOT_FOUND',message:'Command is not registered for this guild'
  });
});
test('management operations require a session and its linked Discord account',async()=>{
  for(const method of ['getCommandAndGuildChannels','getCommandPermissions','editCommandPermissions']) {
    const args={...input,permissions:[],type:'allow'};
    const anonymous=fixture({anonymous:true});
    await assert.rejects(anonymous.caller[method](args),{code:'UNAUTHORIZED',message:'Not Authenticated'});
    assert.equal(anonymous.trace.length,0);assert.equal(anonymous.accountQueries.length,0);
    const expired=fixture({expired:true});
    await assert.rejects(expired.caller[method](args),{code:'UNAUTHORIZED',message:'Discord login has expired'});
    assert.equal(expired.trace.length,0);
    assert.deepEqual(plain(expired.accountQueries),[{
      where:{provider_providerAccountId:{provider:'discord',providerAccountId:'discord-owner'}},
      select:{userId:true,access_token:true}
    }]);
  }
});
test('exact PUT body/headers preserve overrides in allow, deny and existing arbitrary mode inputs',async()=>{
  for(const type of ['allow','deny','other']) {
    const f=fixture();const permissions=[{id:'new-role',type:1,permission:type!=='allow'}];
    const result=await f.caller.editCommandPermissions({...input,type,permissions});
    const sent=f.trace.find(c=>c.init.method==='PUT');
    const expected={permissions:[{id:'guild',type:1,permission:type==='allow'},...permissions,...overrides.slice(1)]};
    assert.equal(sent.init.body,JSON.stringify(expected));
    assert.deepEqual(plain(sent.init.headers),{Authorization:'Bearer fixture-oauth','Content-Type':'application/json'});
    assert.ok(sent.url.endsWith('/guilds/guild/commands/local/permissions'));
    assert.deepEqual(plain(result),{command:{id:'local',application_id:'app',guild_id:'guild',...expected}});
    assert.deepEqual(f.activity,[{
      guildId:'guild',actorDiscordId:'discord-owner',kind:'COMMAND_PERMISSIONS',commandName:'/play',
      before:{roles:[{id:'old-role',allowed:true}]},
      after:{roles:[{id:'guild',allowed:type==='allow'},{id:'new-role',allowed:type!=='allow'}]}
    }]);
  }
});
test('permission audit failure reports Discord success without reissuing the write', async () => {
  const f=fixture({activityFailure:true});
  const result=await f.caller.editCommandPermissions({...input,type:'deny',permissions:[]});
  assert.equal(result.activityRecorded,false);
  assert.equal(result.command.id,input.commandId);
  assert.equal(f.trace.filter(call=>call.init.method==='PUT').length,1);
  assert.deepEqual(f.activity,[]);
});
test('10066 fallback is restricted to permissions GET after registration validation',async()=>{
  const f=fixture({permissionStatus:404,discordCode:10066});
  assert.deepEqual(plain(await f.caller.getCommandPermissions(input)),{command:{id:'local',application_id:'app',guild_id:'guild',permissions:[]}});
  const before=f.trace.length;
  await assert.rejects(f.caller.getCommandPermissions({...input,commandId:'missing'}),{code:'NOT_FOUND'});
  assert.ok(f.trace.slice(before).every(c=>!c.url.endsWith('/permissions')));
  await assert.rejects(fixture({detailStatus:404,permissionStatus:404,discordCode:10066}).caller.getCommandAndGuildChannels(input),{code:'NOT_FOUND'});
  await assert.rejects(fixture({listStatus:404}).caller.getCommandPermissions(input),{code:'NOT_FOUND'});
  await assert.rejects(fixture({putStatus:404}).caller.editCommandPermissions({...input,type:'allow',permissions:[]}),{code:'NOT_FOUND'});
});
test('permission read/write errors, invalid JSON and network failures stay errors',async()=>{
  for(const [status,code] of [[401,'UNAUTHORIZED'],[403,'FORBIDDEN'],[404,'NOT_FOUND'],[429,'TOO_MANY_REQUESTS'],[500,'INTERNAL_SERVER_ERROR']]) {
    for(const operation of ['read','write']) {
      const f=fixture(operation==='read'?{permissionStatus:status,discordCode:10063}:{putStatus:status});
      await assert.rejects(operation==='read'?f.caller.getCommandPermissions(input):f.caller.editCommandPermissions({...input,type:'allow',permissions:[]}),
        e=>e.code===code&&e.message.includes('Discord returned '+status));
    }
  }
  for(const options of [{network:true},{invalidJSON:true}]) await assert.rejects(fixture(options).caller.getCommandPermissions(input),{code:'INTERNAL_SERVER_ERROR'});
});
test('toggle set is exactly the 18 unchanged bot-enforced command names',()=>{
  const router=source('packages/api/src/routers/command.ts');
  const names=Array.from(router.match(/const toggleableCommands = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/"([a-z]+)"/g),m=>m[1]);
  const expected=['bassboost','karaoke','leave','lyrics','move','nightcore','pause','play','queue','remove','resume','seek','shuffle','skip','skipto','summon','vaporwave','volume'];
  assert.deepEqual(names,expected);
  for(const name of names) assert.match(source('packages/bot/src/commands/music/'+name+'.ts'),/isCommandDisabled/);
});
