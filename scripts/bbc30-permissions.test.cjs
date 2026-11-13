// Offline fixtures against the actual shared model; no application entrypoint/env.
// Optional: node scripts/bbc30-permissions.test.cjs --baseline-page path/to/page.txt
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
function load(source) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022
  } }).outputText, { exports, require(id) { throw Error('Forbidden import: '+id); } });
  return exports;
}
const model = load(fs.readFileSync(path.join(root,'packages/api/src/commandPermissions.ts'),'utf8'));
const roles = [{id:'guild',name:'@everyone',color:0},{id:'a',name:'Alpha',color:0},{id:'b',name:'Beta',color:123}];
const rule = (id, permission, type=1) => ({id,type,permission});
test('decode defaults, everyone inversion, deleted roles and non-role overrides',()=>{
  assert.deepEqual(plain(model.decodeRolePermissions(roles,[])),{allowedRoles:[],deniedRoles:[],mode:'allow'});
  for(const everyone of [true,false]) {
    const decoded=model.decodeRolePermissions(roles,[rule('guild',everyone),rule('a',true),rule('b',false),rule('deleted',true),rule('b',true,2),rule('channel',false,3)]);
    assert.deepEqual(plain(decoded),{allowedRoles:[roles[1]],deniedRoles:[roles[2]],mode:everyone?'allow':'deny'});
    assert.deepEqual(plain(model.serializeRolePermissions(decoded)),{type:everyone?'allow':'deny',permissions:[everyone?rule('b',false):rule('a',true)]});
  }
  assert.equal(model.decodeRolePermissions(roles.slice(1),[rule('guild',false)]).mode,'allow');
});
test('selection moves a role, removal is list-specific, radio switches retain both drafts',()=>{
  const initial=model.decodeRolePermissions(roles,[rule('a',true),rule('b',false)]);
  const snapshot=plain(initial);
  const moved=model.selectPermissionRole(initial,'deny',roles[1]);
  assert.deepEqual(plain(moved),{allowedRoles:[],deniedRoles:[roles[2],roles[1]],mode:'allow'});
  assert.deepEqual(plain(initial),snapshot);
  const removed=model.removePermissionRole(moved,'deny','b');
  assert.deepEqual(plain(removed.deniedRoles),[roles[1]]);
  const allowed=model.selectPermissionRole(removed,'allow',roles[1]);
  assert.deepEqual(plain(allowed.deniedRoles),[]);
  assert.deepEqual(plain(model.serializeRolePermissions({...allowed,mode:'deny'})),{type:'deny',permissions:[rule('a',true)]});
  assert.deepEqual(plain(model.serializeRolePermissions(allowed)),{type:'allow',permissions:[]});
});
test('exact API payload replaces role overrides and retains user/channel order and values',()=>{
  const current=[rule('old',true),rule('user',false,2),rule('channel',true,3),rule('future',false,9)];
  for(const mode of ['allow','deny','unrecognized']) {
    const input=[rule('a',mode!=='allow')];
    assert.deepEqual(plain(model.commandPermissionPayload('guild',mode,input,current)),{
      permissions:[rule('guild',mode==='allow'),...input,...current.slice(1)]
    });
  }
  // The existing z.number()/z.string() contract accepts these inputs; extraction
  // must not add validation or discard/normalize entries at the payload boundary.
  const arbitrary=[rule('user',true,2),rule('guild',false)];
  assert.deepEqual(plain(model.commandPermissionPayload('guild','allow',arbitrary,[])),{
    permissions:[rule('guild',true),...arbitrary]
  });
});
const baseline=process.argv.indexOf('--baseline-page');
if(baseline!==-1) test('before/after decode and exact serialization agree on 128 characterized combinations',()=>{
  const original=fs.readFileSync(process.argv[baseline+1],'utf8');
  const start=original.indexOf('function sortRolePermissions(');
  assert.ok(start!==-1);
  const old=load(original.slice(start)+'\nexports.decode = sortRolePermissions;').decode;
  for(let bits=0;bits<128;bits++) {
    const permissions=[rule('guild',Boolean(bits&1)),rule('a',Boolean(bits&2)),rule('b',Boolean(bits&4)),rule('deleted',Boolean(bits&8)),rule('user',Boolean(bits&16),2),rule('channel',Boolean(bits&32),3)];
    if(bits&64) permissions.shift();
    const before=old({roles,permissions:{permissions}});
    const after=model.decodeRolePermissions(roles,permissions);
    assert.deepEqual(plain(after),{allowedRoles:plain(before.allowedRoles),deniedRoles:plain(before.deniedRoles),mode:before.everyoneAllowed?'allow':'deny'});
    for(const mode of ['allow','deny']) {
      const expected=(mode==='allow'?before.deniedRoles:before.allowedRoles).map(r=>rule(r.id,mode==='deny'));
      assert.deepEqual(plain(model.serializeRolePermissions({...after,mode})),{type:mode,permissions:plain(expected)});
    }
  }
});
