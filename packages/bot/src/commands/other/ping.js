"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
let PingCommand = class PingCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        const ping = Date.now() - interaction.createdTimestamp;
        const apiPing = Math.round(interaction.client.ws.ping);
        return await interaction.reply(`Pong! - Bot Latency: ${ping}ms - API Latency: ${apiPing}ms - Round Trip: ${ping + apiPing}ms`);
    }
    async messageRun(message) {
        const ping = Date.now() - message.createdTimestamp;
        const apiPing = Math.round(message.client.ws.ping);
        return await message.reply(`Pong! - Bot Latency: ${ping}ms - API Latency: ${apiPing}ms - Round Trip: ${ping + apiPing}ms`);
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
PingCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'ping',
        description: 'Replies with Pong!'
    })
], PingCommand);
exports.PingCommand = PingCommand;
//# sourceMappingURL=ping.js.map