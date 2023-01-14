"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartyCommand = void 0;
// ts-nocheck
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_together_1 = require("discord-together");
let PartyCommand = class PartyCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        if (!interaction.guild) {
            return await interaction.reply(`You can't use this command in a DM!`);
        }
        const { client } = framework_1.container;
        let discordTogether = new discord_together_1.DiscordTogether(client);
        if (interaction.member.voice.channel) {
            discordTogether.createTogetherCode(interaction.member.voice.channel.id, 'youtube').then(async (invite) => {
                return await interaction.reply(invite.code);
            });
        }
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
PartyCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'party',
        description: 'Watch YouTube videos together!'
    })
], PartyCommand);
exports.PartyCommand = PartyCommand;
//# sourceMappingURL=party.js.map