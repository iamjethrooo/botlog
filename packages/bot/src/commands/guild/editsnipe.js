"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditSnipeCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
let EditSnipeCommand = class EditSnipeCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        if (!interaction.guild)
            return interaction.reply(`You can't use this command in a DM!`);
        const { client } = framework_1.container;
        if (interaction.member.permissions.has('ADMINISTRATOR') || interaction.member.roles.cache.find(r => r.name === 'Sniper' || r.name === 'Enforcer' || r.name === 'Ruby (Lvl. 75+)' || r.name === 'Emerald (Lvl. 60+)' || r.name === 'Sapphire (Lvl. 45+)' || r.name === 'Steel (Lvl. 30+)' || r.name === 'Obsidian (Lvl. 15+)')) {
            const editsniped = client.editsnipes.get(interaction.channelId);
            if (editsniped === undefined) {
                return await interaction.reply({ ephemeral: true, content: 'There\'s nothing to snipe!' });
            }
            interaction.channel.messages.fetch(editsniped.id).then(m => {
                const embed = new discord_js_1.MessageEmbed()
                    .setAuthor(`${editsniped.author.username}#${editsniped.author.discriminator}`, editsniped.author.displayAvatarURL({ dynamic: true }))
                    .setDescription(`**Original message:** ${editsniped.content}\n**Edited message:** ${m.content}`)
                    .setTimestamp(editsniped.createdAt)
                    .setColor(interaction.member.displayHexColor);
                return interaction.reply({ embeds: [embed] });
            });
        }
        else {
            await interaction.reply('You don\'t have the permissions to run this command!');
            setTimeout(() => interaction.deleteReply(), 15000);
            return;
        }
    }
    async messageRun(message) {
        if (!message.guild)
            return message.reply(`You can't use this command in a DM!`);
        const { client } = framework_1.container;
        if (message.member.permissions.has('ADMINISTRATOR') || message.member.roles.cache.find(r => r.name === 'Sniper' || r.name === 'Enforcer' || r.name === 'Ruby (Lvl. 75+)' || r.name === 'Emerald (Lvl. 60+)' || r.name === 'Sapphire (Lvl. 45+)' || r.name === 'Steel (Lvl. 30+)' || r.name === 'Obsidian (Lvl. 15+)')) {
            const editsniped = client.editsnipes.get(message.channelId);
            if (!editsniped) {
                return message.reply(`There's nothing to snipe!`).then(() => setTimeout(() => message.delete())).then(message.delete);
            }
            message.channel.messages.fetch(editsniped.id).then(m => {
                const embed = new discord_js_1.MessageEmbed()
                    .setAuthor(`${editsniped.author.username}#${editsniped.author.discriminator}`, editsniped.author.displayAvatarURL({ dynamic: true }))
                    .setDescription(`**Original message:** ${editsniped.content}\n**Edited message:** ${m.content}`)
                    .setTimestamp(editsniped.createdAt)
                    .setColor(message.member.displayHexColor);
                return message.reply({ embeds: [embed] });
            });
            return;
        }
        else {
            return await message.reply('You don\'t have the permissions to run this command!').then(message => setTimeout(() => message.delete(), 15000));
        }
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
EditSnipeCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'editsnipe',
        description: 'Reveal the last edited message in the channel.'
    })
], EditSnipeCommand);
exports.EditSnipeCommand = EditSnipeCommand;
//# sourceMappingURL=editsnipe.js.map