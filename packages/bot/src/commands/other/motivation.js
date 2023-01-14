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
exports.MotivationCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
let MotivationCommand = class MotivationCommand extends framework_1.Command {
    chatInputRun(interaction) {
        axios_1.default
            .get('https://type.fit/api/quotes')
            .then(async (response) => {
            const quotes = response.data;
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#FFD77A')
                .setAuthor({
                name: 'Motivational Quote',
            })
                .setDescription(`*"${randomQuote.text}*"\n\n-${randomQuote.author}`)
                .setTimestamp();
            return await interaction.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            console.error(error);
            return await interaction.reply('Something went wrong when fetching a motivational quote :(');
        });
    }
    async messageRun(message) {
        axios_1.default
            .get('https://type.fit/api/quotes')
            .then(async (response) => {
            const quotes = response.data;
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#FFD77A')
                .setAuthor({
                name: 'Motivational Quote',
            })
                .setDescription(`*"${randomQuote.text}*"\n\n-${randomQuote.author}`)
                .setTimestamp();
            return await message.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            console.error(error);
            return await message.reply('Something went wrong when fetching a motivational quote :(');
        });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
MotivationCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'motivation',
        aliases: ['motivate'],
        description: 'Replies with a motivational quote!'
    })
], MotivationCommand);
exports.MotivationCommand = MotivationCommand;
//# sourceMappingURL=motivation.js.map