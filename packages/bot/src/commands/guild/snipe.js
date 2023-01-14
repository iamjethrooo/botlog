"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnipeCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
let SnipeCommand = class SnipeCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        if (!interaction.guild) {
            return await interaction.reply(`You can't use this command in a DM!`);
        }
        const { client } = framework_1.container;
        const sniped = client.snipes.get(interaction.channelId);
        if (interaction.member.permissions.has("ADMINISTRATOR") ||
            interaction.member.roles.cache.find((r) => r.name === "Sniper" ||
                r.name === "Enforcer" ||
                r.name === "Ruby (Lvl. 75+)" ||
                r.name === "Emerald (Lvl. 60+)" ||
                r.name === "Sapphire (Lvl. 45+)" ||
                r.name === "Steel (Lvl. 30+)" ||
                r.name === "Obsidian (Lvl. 15+)")) {
            if (!sniped) {
                return await interaction.reply({
                    ephemeral: true,
                    content: "There's nothing to snipe!",
                });
            }
            let content = `**${sniped[0].author}**: ${sniped[0].content}`;
            if (sniped.length > 1) {
                content = `**${sniped[1].author}**: ${sniped[1].content}\n` + content;
            }
            if (sniped.length > 2) {
                content = `**${sniped[2].author}**: ${sniped[2].content}\n` + content;
            }
            const embed = new discord_js_1.MessageEmbed()
                .setDescription(content)
                .setColor(interaction.member.displayHexColor);
            return await interaction.reply({ embeds: [embed] });
        }
        return await interaction.reply({
            ephemeral: true,
            content: "You don't have the permissions to run this command!",
        });
    }
    async messageRun(message, args) {
        if (!message.guild) {
            return await message.reply(`You can't use this command in a DM!`);
        }
        const { client } = framework_1.container;
        if (message.member.permissions.has("ADMINISTRATOR") ||
            message.member.roles.cache.find((r) => r.name === "Sniper" ||
                r.name === "Enforcer" ||
                r.name === "Ruby (Lvl. 75+)" ||
                r.name === "Emerald (Lvl. 60+)" ||
                r.name === "Sapphire (Lvl. 45+)" ||
                r.name === "Steel (Lvl. 30+)" ||
                r.name === "Obsidian (Lvl. 15+)")) {
            const sniped = client.snipes.get(message.channel.id);
            if (!sniped) {
                return await message
                    .reply("There's nothing to snipe!")
                    .then((message) => setTimeout(() => message.delete(), 15000))
                    .then(message.delete);
            }
            let num = await args.pick("integer").catch(() => -1);
            if (num <= 0) {
                let content = `**${sniped[0].author}**: ${sniped[0].content}`;
                if (sniped.length > 1) {
                    content = `**${sniped[1].author}**: ${sniped[1].content}\n` + content;
                }
                if (sniped.length > 2) {
                    content = `**${sniped[2].author}**: ${sniped[2].content}\n` + content;
                }
                const embed = new discord_js_1.MessageEmbed()
                    .setDescription(content)
                    .setColor(message.member.displayHexColor);
                return await message.reply({ embeds: [embed] });
            }
            else {
                num--;
                if (!sniped[num]) {
                    return await message
                        .reply("There's nothing to snipe!")
                        .then((message) => setTimeout(() => message.delete(), 15000))
                        .then(message.delete);
                }
                const singleSnipe = sniped[num];
                const embed = new discord_js_1.MessageEmbed()
                    .setAuthor(`${singleSnipe.author.username}#${singleSnipe.author.discriminator}`, singleSnipe.author.displayAvatarURL({ dynamic: true }))
                    .setDescription(singleSnipe.content)
                    .setTimestamp(singleSnipe.createdAt)
                    .setColor(message.member.displayHexColor);
                if (singleSnipe.channel instanceof discord_js_1.TextChannel) {
                    embed.setFooter("#".concat(singleSnipe.channel.name));
                }
                return await message.reply({ embeds: [embed] });
            }
        }
        return await message
            .reply("You don't have the permissions to run this command!")
            .then((message) => setTimeout(() => message.delete(), 15000));
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
        });
    }
};
SnipeCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: "snipe",
        description: "Reveal the last deleted message in the channel.",
    })
], SnipeCommand);
exports.SnipeCommand = SnipeCommand;
//# sourceMappingURL=snipe.js.map