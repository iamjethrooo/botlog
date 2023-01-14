"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageStageChannel = void 0;
const logger_1 = __importDefault(require("../logger"));
async function manageStageChannel(voiceChannel, botUser, instance) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (voiceChannel.type !== 'GUILD_STAGE_VOICE')
        return;
    // Stage Channel Permissions From Discord.js Doc's
    if (!(botUser === null || botUser === void 0 ? void 0 : botUser.permissions.has(('MANAGE_CHANNELS' && 'MUTE_MEMBERS' && 'MOVE_MEMBERS') || 'ADMINISTRATOR')))
        if (botUser.voice.suppress)
            return await instance.getTextChannel().then(async (msg) => await (msg === null || msg === void 0 ? void 0 : msg.send({
                content: `:interrobang: Please make promote me to a Speaker in ${voiceChannel.name}, Missing permissions "Administrator" ***OR*** "Manage Channels, Mute Members, and Move Members" for Full Stage Channel Features.`
            })));
    const tracks = await instance.tracks();
    const title = ((_a = instance.player.trackData) === null || _a === void 0 ? void 0 : _a.title.length) > 114
        ? `🎶 ${(_c = (_b = instance.player.trackData) === null || _b === void 0 ? void 0 : _b.title.slice(0, 114)) !== null && _c !== void 0 ? _c : (_d = tracks.at(0)) === null || _d === void 0 ? void 0 : _d.title.slice(0, 114)}...`
        : `🎶 ${(_f = (_e = instance.player.trackData) === null || _e === void 0 ? void 0 : _e.title) !== null && _f !== void 0 ? _f : (_g = tracks.at(0)) === null || _g === void 0 ? void 0 : _g.title}`;
    if (!voiceChannel.stageInstance) {
        await voiceChannel
            .createStageInstance({
            topic: title,
            privacyLevel: 2 // Guild Only
        })
            .catch(error => {
            logger_1.default.error('Failed to Create a Stage Instance. ' + error);
        });
    }
    if (botUser === null || botUser === void 0 ? void 0 : botUser.voice.suppress)
        await (botUser === null || botUser === void 0 ? void 0 : botUser.voice.setSuppressed(false).catch((error) => {
            logger_1.default.error('Failed to Set Suppressed to False. ' + error);
        }));
    if ((_h = voiceChannel.stageInstance) === null || _h === void 0 ? void 0 : _h.topic.startsWith('🎶')) {
        await ((_j = voiceChannel.stageInstance) === null || _j === void 0 ? void 0 : _j.setTopic(title).catch(error => {
            logger_1.default.error('Failed to Set Topic. ' + error);
        }));
    }
    return;
}
exports.manageStageChannel = manageStageChannel;
//# sourceMappingURL=channelHandler.js.map