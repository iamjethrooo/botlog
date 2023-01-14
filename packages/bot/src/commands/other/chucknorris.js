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
exports.ChuckNorrisCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
let ChuckNorrisCommand = class ChuckNorrisCommand extends framework_1.Command {
    chatInputRun(interaction) {
        axios_1.default
            .get('https://api.chucknorris.io/jokes/random')
            .then(async (response) => {
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#CD7232')
                .setAuthor({
                name: 'Chuck Norris',
            })
                .setDescription(response.data.value)
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            console.error(error);
            return await interaction.reply(':x: An error occured, Chuck is investigating this!');
        });
    }
    async messageRun(message) {
        axios_1.default
            .get('https://api.chucknorris.io/jokes/random')
            .then(async (response) => {
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#CD7232')
                .setAuthor({
                name: 'Chuck Norris',
            })
                .setDescription(response.data.value)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            console.error(error);
            return await message.reply(':x: An error occured, Chuck is investigating this!');
        });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
ChuckNorrisCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'chucknorris',
        description: 'Get a satirical fact about Chuck Norris!'
    })
], ChuckNorrisCommand);
exports.ChuckNorrisCommand = ChuckNorrisCommand;
//# sourceMappingURL=chucknorris.js.map