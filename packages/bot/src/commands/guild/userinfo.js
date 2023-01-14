"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfoCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
let UserInfoCommand = class UserInfoCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        if (!interaction.guild)
            return interaction.reply(`You can't use this command in a DM!`);
        const user = interaction.options.getUser('user', true);
        const member = interaction.guild.members.cache.get(user.id);
        const roles = member.roles.cache.filter(r => r.id !== interaction.guildId).map(roles => `<@&${roles.id}>`);
        // Determines whether to reduce the roles array, since Discord only supports up to 1024 characters on an embed.
        var cut = false;
        var max = 0;
        var count = 0;
        for (var i = 0; i < roles.length; i++) {
            count += roles[i].length + 7;
            if (count < 950) {
                max = i;
            }
            else {
                cut = true;
            }
        }
        const embed = new discord_js_1.MessageEmbed()
            .setAuthor(`${user.tag}`, member.displayAvatarURL({ dynamic: true }))
            .setColor(member.displayHexColor)
            .setDescription(`<@${member.id}>`)
            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
            .addField('Joined at: ', member.joinedAt.toString(), true)
            .addField('Created at: ', user.createdAt.toString(), true)
            .addField(`Roles [${member.roles.cache.filter(r => r.id !== interaction.guildId).map(roles => `\`${roles.name}\``).length}]`, `${roles.length == 0 ? "No Roles" : cut ? member.roles.cache.filter(r => r.id !== interaction.guildId).map(roles => `<@&${roles.id}>`).slice(0, max).concat(`... ${roles.length - max} more`).join(" **|** ") : member.roles.cache.filter(r => r.id !== interaction.guildId).map(roles => `<@&${roles.id}>`).join(" **|** ")}`, true)
            .setTimestamp();
        interaction.reply({ embeds: [embed] });
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
                    description: 'The user you want to see information on'
                }
            ]
        });
    }
};
UserInfoCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'userinfo',
        description: 'Reveal information about a member.'
    })
], UserInfoCommand);
exports.UserInfoCommand = UserInfoCommand;
//# sourceMappingURL=userinfo.js.map