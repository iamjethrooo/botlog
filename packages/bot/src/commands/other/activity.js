"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
let ActivityCommand = class ActivityCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        const channel = interaction.options.getChannel('channel', true);
        const activity = interaction.options.getString('activity', true);
        if (channel.type !== 'GUILD_VOICE') {
            return await interaction.reply('You can only invite someone to a voice channel!');
        }
        const member = interaction.member;
        if (member.voice.channelId !== channel.id) {
            return await interaction.reply('You can only invite to the channel you are in!');
        }
        let invite;
        try {
            invite = await channel.createInvite({
                reason: 'Activity command generated invite'
            });
        }
        catch (err) {
            return await interaction.reply(`Something went wrong!`);
        }
        return await interaction.reply(`[Click to join ${activity} in ${channel.name}](${invite.url})`);
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    type: 'CHANNEL',
                    required: true,
                    name: 'channel',
                    description: 'Channel to invite to'
                },
                {
                    type: 'STRING',
                    required: true,
                    name: 'activity',
                    description: 'Activity description'
                }
            ]
        });
    }
};
ActivityCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'activity',
        description: "Generate an invite link to your voice channel's activity",
        preconditions: ['GuildOnly', 'inVoiceChannel']
    })
], ActivityCommand);
exports.ActivityCommand = ActivityCommand;
//# sourceMappingURL=activity.js.map