"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicSongPlayMessageListener = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const ButtonHandler_1 = require("../lib/utils/music/ButtonHandler");
const NowPlayingEmbed_1 = require("../lib/utils/music/NowPlayingEmbed");
let MusicSongPlayMessageListener = class MusicSongPlayMessageListener extends framework_1.Listener {
    async run(channel, track) {
        var _a;
        const { client } = framework_1.container;
        const queue = client.music.queues.get(channel.guild.id);
        const tracks = await queue.tracks();
        const NowPlaying = new NowPlayingEmbed_1.NowPlayingEmbed(track, queue.player.accuratePosition, (_a = track.length) !== null && _a !== void 0 ? _a : 0, queue.player.volume, tracks, tracks.at(-1), queue.paused);
        await (0, ButtonHandler_1.embedButtons)(await NowPlaying.NowPlayingEmbed(), queue, track);
    }
};
MusicSongPlayMessageListener = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'musicSongPlayMessage'
    })
], MusicSongPlayMessageListener);
exports.MusicSongPlayMessageListener = MusicSongPlayMessageListener;
//# sourceMappingURL=musicSongPlayMessage.js.map