"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerIsPlaying = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const framework_2 = require("@sapphire/framework");
let PlayerIsPlaying = class PlayerIsPlaying extends framework_1.Precondition {
    chatInputRun(interaction) {
        const { client } = framework_2.container;
        const player = client.music.players.get(interaction.guildId);
        if (!player) {
            return this.error({ message: 'There is nothing playing at the moment!' });
        }
        return this.ok();
    }
};
PlayerIsPlaying = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'playerIsPlaying'
    })
], PlayerIsPlaying);
exports.PlayerIsPlaying = PlayerIsPlaying;
//# sourceMappingURL=PlayerIsPlaying.js.map