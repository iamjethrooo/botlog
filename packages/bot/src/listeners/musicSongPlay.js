"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicSongPlayListener = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const channelHandler_1 = require("../lib/utils/music/channelHandler");
let MusicSongPlayListener = class MusicSongPlayListener extends framework_1.Listener {
    async run(queue, track) {
        var _a, _b, _c;
        const channel = await queue.getTextChannel();
        if (channel) {
            const { client } = framework_1.container;
            clearTimeout(client.leaveTimers[queue.player.guildId]);
            delete client.leaveTimers[queue.player.guildId];
            // Leave Voice Channel when attempting to stream to an empty channel
            if (((_b = (_a = channel === null || channel === void 0 ? void 0 : channel.guild.me) === null || _a === void 0 ? void 0 : _a.voice.channel) === null || _b === void 0 ? void 0 : _b.members.size) == 1) {
                await queue.leave();
                return;
            }
            queue.client.emit('musicSongPlayMessage', channel, track);
            await (0, channelHandler_1.manageStageChannel)((_c = queue.guild.me) === null || _c === void 0 ? void 0 : _c.voice.channel, queue.guild.me, queue);
        }
    }
};
MusicSongPlayListener = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'musicSongPlay'
    })
], MusicSongPlayListener);
exports.MusicSongPlayListener = MusicSongPlayListener;
//# sourceMappingURL=musicSongPlay.js.map