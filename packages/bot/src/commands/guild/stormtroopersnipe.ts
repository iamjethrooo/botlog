import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container
} from '@sapphire/framework';
import { CommandInteraction, MessageEmbed, Message, GuildMember, TextChannel } from 'discord.js';

const mainIds = ['669193383503200266', '669196309156200469', '728753509255872634', '867306720443498526', '810652009039527966', '740010154216521868'];
// chat, media, bulletin, marketplace, confessions, starboard

const vcIds = ['670925282319925268', '975051930361532466', '737188123334672435', '683503701595652098'];
// no-mic-1, no-mic-2, music-bots-1, music-bots-2

const personalIds = ['669520234276978698', '669520318615912466', '879899778899664956', '877356110812684348', '916665581002948660', '779150722822307861', '736583179187781733'];
// intros, selfies, last-nights-dream, personal-milestone, tabo-thoughts, work-work-work, drink-drink-drink

const createsIds = ['735804432985620521', '669514957938753558', '671669574961201157', '800543054221541376', '669520655041036288', '669514986548232193'];
// discussion, artworks, cosplays, mixtape, poems, snaps

const copiumIds = ['671276042773725184', '669355693140213780', '669355799616684052', '669197278401134605', '722700349890363452', '734570680388943882', '932789458959495248', '957617763424284733', '736566736740024351', '669531140075552769', '912623866587807764', '806343694483587073', '803807351656284170', '802485143096131604', '682838969179832423', '708300479968575584', '928819557559312424'];
// snackbar, memes, weeb-crib, gaming, tech, magic-internet-money, academics, books, tvseries-and-films, music, pet-pals, dialect, fitness, spam, nsfw, confess-nsfw

// const casinoIds = ['734000457755787286', '726224371211042827', '733718733377503245', '674518870211559428', '674860915383992340', '725110364773154896'];
// casino-shop, color-shop, reward-logs, casino-beta, casino-2-beta, casino-3-beta

// const botsIds = ['794833126270566411', '794833143113973760', '929922243323101244', '702339023766552627', '678086381708378113', '738754900992721028', '670801689770590208', '796684897594769418'];
// bots-1, bots-2, counting-2022, counting-lottery-roll, disboard-bump, mudae, level, poketwo

// const serverIds = ['670938708031307807', '669539569942921235', '670926387980402700']
// suggestions, moderations, appeal

// test ids
// var allIds = ['953963313526636544', '835436182778544128', '848135530197942282', '852763685084201000', '901646890817445948', '970559289523597322', '978228788561346571', '979318605374177300'];
var allIds = mainIds.concat(vcIds.concat(personalIds.concat(createsIds.concat(copiumIds))));

@ApplyOptions<CommandOptions>({
  name: 'stormtroopersnipe',
  description: 'Reveals a recently deleted message from a random channel.'
})
export class StormtrooperSnipeCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    if (!interaction.guild) {
      return await interaction.reply(`You can't use this command in a DM!`);
    }
    const { client } = container;

    if ((<GuildMember>interaction.member)!.permissions.has('ADMINISTRATOR') || (<GuildMember>interaction.member)!.roles.cache.find(r => r.name === 'Sniper' || r.name === 'Enforcer' || r.name === 'Ruby (Lvl. 75+)' || r.name === 'Emerald (Lvl. 60+)' || r.name === 'Sapphire (Lvl. 45+)' || r.name === 'Steel (Lvl. 30+)' || r.name === 'Obsidian (Lvl. 15+)')) {
      let hasDeleted = false;
      for (let i = 0; i < allIds.length; i++) {
        if (client.snipes.get(allIds[i])) {
          hasDeleted = true;
          break;
        }
      }

      if (!hasDeleted) {
        return await interaction.reply({ ephemeral: true, content: 'There\'s nothing to snipe!' });
      }
      let randomId = allIds[Math.floor(Math.random() * allIds.length)];
      let snipedArray = client.snipes.get(randomId);

      // Loop until a channel with a recently deleted message appears
      while (!snipedArray) {
        randomId = allIds[Math.floor(Math.random() * allIds.length)];
        snipedArray = client.snipes.get(randomId);
      }
      const sniped = snipedArray[Math.floor(Math.random() * snipedArray.length)];

      let embed = new MessageEmbed()
        .setAuthor(`${sniped.author.username}#${sniped.author.discriminator}`, sniped.author.displayAvatarURL({ dynamic: true }))
        .setDescription(sniped.content)
        .setTimestamp(sniped.createdAt)
        .setColor((<GuildMember>interaction.member)!.displayHexColor)

      if (sniped.channel instanceof TextChannel) {
        embed.setFooter("#".concat(sniped.channel.name));
      }
      return await interaction.reply({ embeds: [embed] });
    }
    return await interaction.reply({ ephemeral: true, content: 'You don\'t have the permissions to run this command!' });
  }

  public override async messageRun(message: Message) {
    if (!message.guild) {
      return await message.reply(`You can't use this command in a DM!`);
    }
    const { client } = container;

    if (message.member!.permissions.has('ADMINISTRATOR') || message.member!.roles.cache.find(r => r.name === 'Sniper' || r.name === 'Enforcer' || r.name === 'Ruby (Lvl. 75+)' || r.name === 'Emerald (Lvl. 60+)' || r.name === 'Sapphire (Lvl. 45+)' || r.name === 'Steel (Lvl. 30+)' || r.name === 'Obsidian (Lvl. 15+)')) {
      let hasDeleted = false;
      for (let i = 0; i < allIds.length; i++) {
        if (client.snipes.get(allIds[i])) {
          hasDeleted = true;
          break;
        }
      }

      if (!hasDeleted) {
        return await message.reply('There\'s nothing to snipe!').then(message => setTimeout(() => message.delete(), 15000));
      }
      let randomId = allIds[Math.floor(Math.random() * allIds.length)];
      let snipedArray = client.snipes.get(randomId);

      // Loop until a channel with a recently deleted message appears
      while (!snipedArray) {
        randomId = allIds[Math.floor(Math.random() * allIds.length)];
        snipedArray = client.snipes.get(randomId);
      }
      const sniped = snipedArray[Math.floor(Math.random() * snipedArray.length)];

      let embed = new MessageEmbed()
        .setAuthor(`${sniped.author.username}#${sniped.author.discriminator}`, sniped.author.displayAvatarURL({ dynamic: true }))
        .setDescription(sniped.content)
        .setTimestamp(sniped.createdAt)
        .setColor(message.member!.displayHexColor)

      if (sniped.channel instanceof TextChannel) {
        embed.setFooter("#".concat(sniped.channel.name));
      }
      return await message.reply({ embeds: [embed] });
    }
    return await message.reply('You don\'t have the permissions to run this command!').then(message => setTimeout(() => message.delete(), 15000));
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description
    });
  }
}
