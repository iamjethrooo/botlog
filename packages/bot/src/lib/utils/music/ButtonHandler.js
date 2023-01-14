"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedButtons = void 0;
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const buttonsCollector_1 = __importStar(require("./buttonsCollector"));
async function embedButtons(embed, queue, song, message) {
    await (0, buttonsCollector_1.deletePlayerEmbed)(queue);
    const { client } = framework_1.container;
    const tracks = await queue.tracks();
    const row = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton()
        .setCustomId('playPause')
        .setLabel('Play/Pause')
        .setStyle('PRIMARY'), new discord_js_1.MessageButton().setCustomId('stop').setLabel('Stop').setStyle('DANGER'), new discord_js_1.MessageButton()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle('PRIMARY')
        .setDisabled(!tracks.length ? true : false), new discord_js_1.MessageButton()
        .setCustomId('volumeUp')
        .setLabel('Vol+')
        .setStyle('PRIMARY'), new discord_js_1.MessageButton()
        .setCustomId('volumeDown')
        .setLabel('Vol-')
        .setStyle('PRIMARY'));
    const channel = await queue.getTextChannel();
    if (!channel)
        return;
    return await channel
        .send({
        embeds: [embed],
        components: [row],
        content: message
    })
        .then(async (message) => {
        const queue = client.music.queues.get(message.guild.id);
        await queue.setEmbed(message.id);
        if (queue.player) {
            await (0, buttonsCollector_1.default)(message, song);
        }
    });
}
exports.embedButtons = embedButtons;
//# sourceMappingURL=ButtonHandler.js.map