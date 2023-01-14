"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildMemberListener = void 0;
//import type { Guild } from '@prisma/client';
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const trpc_1 = require("../trpc");
let GuildMemberListener = class GuildMemberListener extends framework_1.Listener {
    async run(member) {
        const guildQuery = await trpc_1.trpcNode.guild.getGuild.query({
            id: member.guild.id
        });
        if (!guildQuery || !guildQuery.guild)
            return;
        const { welcomeMessage, welcomeMessageEnabled, welcomeMessageChannel } = guildQuery.guild;
        if (!welcomeMessageEnabled ||
            !welcomeMessage ||
            !welcomeMessage.length ||
            !welcomeMessageChannel) {
            return;
        }
        const channel = (await member.guild.channels.fetch(welcomeMessageChannel));
        if (channel) {
            await channel.send({ content: `@${member.id} ${welcomeMessage}` });
        }
    }
};
GuildMemberListener = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'guildMemberAdd'
    })
], GuildMemberListener);
exports.GuildMemberListener = GuildMemberListener;
//# sourceMappingURL=guildMemberAdd.js.map