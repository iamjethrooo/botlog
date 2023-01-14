"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrumpCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
let TrumpCommand = class TrumpCommand extends framework_1.Command {
    chatInputRun(interaction) {
        axios_1.default
            .get('https://api.tronalddump.io/random/quote')
            .then(async (response) => {
            const quote = response.data.value;
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#BB7D61')
                .setAuthor({
                name: 'Donald Trump',
                url: 'https://api.tronalddump.io/random/quote',
                iconURL: 'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg'
            })
                .setDescription(quote)
                .setTimestamp(response.data.appeared_at);
            return await interaction.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            console.error(error);
            return await interaction.reply('Something went wrong when fetching a Trump quote :(');
        });
    }
    async messageRun(message) {
        axios_1.default
            .get('https://api.tronalddump.io/random/quote')
            .then(async (response) => {
            const quote = response.data.value;
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#BB7D61')
                .setAuthor({
                name: 'Donald Trump',
                url: 'https://api.tronalddump.io/random/quote',
                iconURL: 'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg'
            })
                .setDescription(quote)
                .setTimestamp(response.data.appeared_at);
            return await message.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            console.error(error);
            return await message.reply('Something went wrong when fetching a Trump quote :(');
        });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
TrumpCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'trump',
        description: 'Replies with a random Trump quote'
    })
], TrumpCommand);
exports.TrumpCommand = TrumpCommand;
//# sourceMappingURL=trump.js.map