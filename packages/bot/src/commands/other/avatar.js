"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
let AvatarCommand = class AvatarCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        const user = interaction.options.getUser('user', true);
        const embed = new discord_js_1.MessageEmbed()
            .setTitle(user.username)
            .setImage(user.displayAvatarURL({ dynamic: true }))
            .setColor('#0x00ae86');
        return await interaction.reply({ embeds: [embed] });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    type: 'USER',
                    required: true,
                    name: 'user',
                    description: `Which user's avatar do you want to look at?`
                }
            ]
        });
    }
};
AvatarCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'avatar',
        description: `Responds with a user's avatar`,
        preconditions: ['GuildOnly']
    })
], AvatarCommand);
exports.AvatarCommand = AvatarCommand;
//# sourceMappingURL=avatar.js.map