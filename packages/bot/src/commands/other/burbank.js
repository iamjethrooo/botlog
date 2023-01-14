"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BurbankCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
let BurbankCommand = class BurbankCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        const embed = new discord_js_1.MessageEmbed()
            .setTitle('The Burbank')
            .setColor('#893cbc')
            .setThumbnail('https://cdn.discordapp.com/attachments/734048924519759982/734070202118963290/JPEG_20200718_233247.jpg')
            .setDescription('1 shot Gin\n1 teaspoon Hot Sauce\n1 teaspoon Whole Pepper Corn\n1 teaspoon Bear Brand\n1 teaspoon Curry Powder')
            .setURL('https://discordapp.com/channels/669190303353143306/734048924519759982/734070202500776036')
            .setFooter('Burbank\'s Ungodly Concoction');
        return await interaction.reply({ embeds: [embed] });
    }
    async messageRun(message) {
        const embed = new discord_js_1.MessageEmbed()
            .setTitle('The Burbank')
            .setColor('#893cbc')
            .setThumbnail('https://cdn.discordapp.com/attachments/734048924519759982/734070202118963290/JPEG_20200718_233247.jpg')
            .setDescription('1 shot Gin\n1 teaspoon Hot Sauce\n1 teaspoon Whole Pepper Corn\n1 teaspoon Bear Brand\n1 teaspoon Curry Powder')
            .setURL('https://discordapp.com/channels/669190303353143306/734048924519759982/734070202500776036')
            .setFooter('Burbank\'s Ungodly Concoction');
        return await message.reply({ embeds: [embed] });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
BurbankCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'burbank',
        description: 'Check out Burbank\'s Ungodly Concoction.'
    })
], BurbankCommand);
exports.BurbankCommand = BurbankCommand;
//# sourceMappingURL=burbank.js.map