"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameInvite = void 0;
const discord_js_1 = require("discord.js");
class GameInvite {
    constructor(title, players, interaction) {
        this.title = title;
        this.players = players;
        this.interaction = interaction;
    }
    gameInviteEmbed() {
        let thumbnail = '';
        switch (this.title) {
            case 'Connect 4':
                thumbnail = 'https://i.imgur.com/cUpy82Q.png';
                break;
            case 'Tic-Tac-Toe':
                thumbnail = 'https://i.imgur.com/lbPsXXN.png';
                break;
            default:
                thumbnail = this.interaction.user.displayAvatarURL({ dynamic: true });
                break;
        }
        const gameInvite = new discord_js_1.MessageEmbed()
            .setAuthor({
            name: this.interaction.user.username,
            iconURL: this.interaction.user.avatar
                ? this.interaction.user.displayAvatarURL()
                : this.interaction.user.defaultAvatarURL
        })
            .setTitle(`${this.title} - Game Invitation`)
            .setColor('YELLOW')
            .setThumbnail(thumbnail)
            .setDescription(`${this.interaction.user} would like to play a game of ${this.title}. Click Yes or No. if you want to join in`)
            .addFields({
            name: 'Players',
            value: `${this.players.length > 0 ? this.players : 'None'}`,
            inline: true
        })
            .setFooter({ text: 'Invite will expire in 60 seconds' })
            .setTimestamp();
        return gameInvite;
    }
    gameInviteButtons() {
        var _a, _b, _c;
        const gameInviteButtons = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton()
            .setCustomId(`${this.interaction.id}${(_a = this.players.at(0)) === null || _a === void 0 ? void 0 : _a.id}-Yes`)
            .setLabel('Yes')
            .setStyle('SUCCESS'), new discord_js_1.MessageButton()
            .setCustomId(`${this.interaction.id}${(_b = this.players.at(0)) === null || _b === void 0 ? void 0 : _b.id}-No`)
            .setLabel('No')
            .setStyle('DANGER'), new discord_js_1.MessageButton()
            .setCustomId(`${this.interaction.id}${(_c = this.players.at(0)) === null || _c === void 0 ? void 0 : _c.id}-Start`)
            .setLabel('Start')
            .setStyle('PRIMARY'));
        return gameInviteButtons;
    }
}
exports.GameInvite = GameInvite;
//# sourceMappingURL=inviteEmbed.js.map