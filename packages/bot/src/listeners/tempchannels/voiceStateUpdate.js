"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceStateUpdateListener = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const trpc_1 = require("../../trpc");
let VoiceStateUpdateListener = class VoiceStateUpdateListener extends framework_1.Listener {
    async run(oldState, newState) {
        const { guild: guildDB } = await trpc_1.trpcNode.guild.getGuild.query({
            id: newState.guild.id
        });
        // now user is in hub channel, create him a new voice channel and move him there
        if (newState.channelId) {
            if (!newState.member)
                return; // should not happen but just in case
            if (newState.channelId === (guildDB === null || guildDB === void 0 ? void 0 : guildDB.hubChannel) && guildDB.hub) {
                const { tempChannel } = await trpc_1.trpcNode.hub.getTempChannel.query({
                    guildId: newState.guild.id,
                    ownerId: newState.member.id
                });
                // user entered hub channel but he already has a temp channel, so move him there
                if (tempChannel) {
                    await newState.setChannel(tempChannel.id);
                    return;
                }
                const guild = newState.guild;
                const channels = guild.channels;
                const channel = await channels.create(`${newState.member.user.username}'s channel`, {
                    type: 'GUILD_VOICE',
                    parent: guildDB === null || guildDB === void 0 ? void 0 : guildDB.hub,
                    permissionOverwrites: [
                        {
                            id: newState.member.id,
                            allow: [
                                'MOVE_MEMBERS',
                                'MUTE_MEMBERS',
                                'DEAFEN_MEMBERS',
                                'MANAGE_CHANNELS',
                                'STREAM'
                            ]
                        }
                    ]
                });
                await trpc_1.trpcNode.hub.createTempChannel.mutate({
                    guildId: newState.guild.id,
                    ownerId: newState.member.id,
                    channelId: channel.id
                });
                await newState.member.voice.setChannel(channel);
            }
            else {
                const { tempChannel } = await trpc_1.trpcNode.hub.getTempChannel.query({
                    guildId: newState.guild.id,
                    ownerId: newState.member.id
                });
                if (!tempChannel)
                    return;
                if (tempChannel.id === newState.channelId)
                    return;
                const channel = (await newState.guild.channels.fetch(tempChannel.id));
                if (!channel)
                    return;
                Promise.all([
                    channel.delete(),
                    trpc_1.trpcNode.hub.deleteTempChannel.mutate({
                        channelId: tempChannel.id
                    })
                ]);
            }
        }
        else if (!newState.channelId) {
            // user left hub channel, delete his temp channel
            deleteChannel(oldState);
        }
    }
};
VoiceStateUpdateListener = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'voiceStateUpdate'
    })
], VoiceStateUpdateListener);
exports.VoiceStateUpdateListener = VoiceStateUpdateListener;
async function deleteChannel(state) {
    var _a;
    const { tempChannel } = await trpc_1.trpcNode.hub.getTempChannel.query({
        guildId: state.guild.id,
        ownerId: state.member.id
    });
    if (tempChannel) {
        Promise.all([
            (_a = state.channel) === null || _a === void 0 ? void 0 : _a.delete(),
            trpc_1.trpcNode.hub.deleteTempChannel.mutate({
                channelId: tempChannel.id
            })
        ]);
    }
}
//# sourceMappingURL=voiceStateUpdate.js.map