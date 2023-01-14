"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicFinishListener = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const buttonsCollector_1 = require("../lib/utils/music/buttonsCollector");
const handleOptions_1 = require("../lib/utils/music/handleOptions");
let MusicFinishListener = class MusicFinishListener extends framework_1.Listener {
    async run(queue, skipped = false) {
        const channel = await queue.getTextChannel();
        const { client } = framework_1.container;
        await (0, buttonsCollector_1.deletePlayerEmbed)(queue);
        if (skipped)
            return;
        client.leaveTimers[queue.player.guildId] = setTimeout(async () => {
            if (channel)
                queue.client.emit('musicFinishNotify', channel);
            await queue.leave();
        }, (0, handleOptions_1.inactivityTime)());
    }
};
MusicFinishListener = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'musicFinish'
    })
], MusicFinishListener);
exports.MusicFinishListener = MusicFinishListener;
//# sourceMappingURL=musicFinish.js.map