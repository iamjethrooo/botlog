"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inPlayerVoiceChannel = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const framework_2 = require("@sapphire/framework");
let inPlayerVoiceChannel = class inPlayerVoiceChannel extends framework_1.Precondition {
    chatInputRun(interaction) {
        const member = interaction.member;
        // this precondition comes after a precondition that makes sure the user is in a voice channel
        const voiceChannel = member.voice.channel;
        const { client } = framework_2.container;
        const queue = client.music.queues.get(interaction.guildId);
        const queueVoiceChannel = queue.voiceChannel;
        if (queueVoiceChannel && queueVoiceChannel.id !== voiceChannel.id) {
            return this.error({
                message: `You're in the wrong channel! Join <#${queueVoiceChannel === null || queueVoiceChannel === void 0 ? void 0 : queueVoiceChannel.id}>`
            });
        }
        return this.ok();
    }
};
inPlayerVoiceChannel = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'inPlayerVoiceChannel'
    })
], inPlayerVoiceChannel);
exports.inPlayerVoiceChannel = inPlayerVoiceChannel;
//# sourceMappingURL=InPlayerVC.js.map