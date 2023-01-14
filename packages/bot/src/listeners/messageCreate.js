"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageListener = void 0;
// @ts-nocheck
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const picsOnlyChannels = [
    "669514957938753558",
    "800543054221541376",
    "669514986548232193",
    "671669574961201157",
    "801677818760003594",
    "978228788561346571",
    "1044996825754644670",
];
let MessageListener = class MessageListener extends framework_1.Listener {
    async run(message) {
        if (message.guild === null)
            return;
        const { client } = framework_1.container;
        const isBot = message.author.bot;
        if (isBot)
            return;
        // Removes text messages in media-only channels
        if (picsOnlyChannels.includes(message.channel.id)) {
            const isAdmin = message.member.permissions.has("ADMINISTRATOR");
            if (!isAdmin) {
                // For discussions category
                if (!(message.attachments.size > 0 || message.embeds.length > 0)) {
                    // Store values related to the message
                    // discussionChannel: '735804432985620521'
                    const discussionChannel = client.channels.cache.get("735804432985620521");
                    const guildId = message.guild.id;
                    const channelId = message.channel.id;
                    const authorId = message.author.id;
                    let content = message.content;
                    let hasReplied = false;
                    if (message.reference)
                        hasReplied = true;
                    message
                        .delete()
                        .then(message.channel
                        .send(`Don't chat here, please use the <#735804432985620521> channel above.`)
                        .then((message) => setTimeout(() => message.delete(), 5000)));
                    if (content.includes("@everyone") || content.includes("@here")) {
                        content = discord_js_1.Util.removeMentions(content);
                    }
                    let embed = new discord_js_1.MessageEmbed()
                        .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL({ dynamic: true }))
                        .addField("Message content:", content)
                        .setTimestamp(message.createdAt)
                        .setColor(message.member.displayHexColor)
                        .setFooter("#".concat(message.channel.name));
                    discussionChannel.send(`<@${authorId}>`);
                    // If author replied to a message
                    if (hasReplied) {
                        let referenceId = message.reference.messageId;
                        embed.addField("Replied to:", `[Click to jump to message.](https://discord.com/channels/${guildId}/${channelId}/${referenceId})`);
                        return discussionChannel.send({ embeds: [embed] });
                    }
                    return discussionChannel.send({ embeds: [embed] });
                }
            }
        }
    }
};
MessageListener = __decorate([
    (0, decorators_1.ApplyOptions)({
        event: "messageCreate",
    })
], MessageListener);
exports.MessageListener = MessageListener;
//# sourceMappingURL=messageCreate.js.map