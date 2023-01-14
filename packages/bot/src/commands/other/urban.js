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
exports.UrbanCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
let UrbanCommand = class UrbanCommand extends framework_1.Command {
    chatInputRun(interaction) {
        const query = interaction.options.getString('query', true);
        axios_1.default
            .get(`https://api.urbandictionary.com/v0/define?term=${query}`)
            .then(async (response) => {
            const definition = response.data.list[0].definition;
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#BB7D61')
                .setAuthor({
                name: 'Urban Dictionary',
                url: 'https://urbandictionary.com',
                iconURL: 'https://i.imgur.com/vdoosDm.png'
            })
                .setDescription(definition)
                .setURL(response.data.list[0].permalink)
                .setTimestamp()
                .setFooter({
                text: 'Powered by UrbanDictionary'
            });
            return await interaction.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            console.error(error);
            return await interaction.reply('Failed to deliver definition :sob:');
        });
    }
    async messageRun(message, args) {
        const query = await args.rest('string');
        axios_1.default
            .get(`https://api.urbandictionary.com/v0/define?term=${query}`)
            .then(async (response) => {
            const definition = response.data.list[0].definition;
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#BB7D61')
                .setAuthor({
                name: 'Urban Dictionary',
                url: 'https://urbandictionary.com',
                iconURL: 'https://i.imgur.com/vdoosDm.png'
            })
                .setDescription(definition)
                .setURL(response.data.list[0].permalink)
                .setTimestamp()
                .setFooter({
                text: 'Powered by UrbanDictionary'
            });
            return await message.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            console.error(error);
            return await message.reply('Failed to deliver definition :sob:');
        });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'query',
                    type: 'STRING',
                    description: 'What term do you want to look up?',
                    required: true
                }
            ]
        });
    }
};
UrbanCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'urban',
        description: 'Get definitions from urban dictonary',
        preconditions: ['GuildOnly']
    })
], UrbanCommand);
exports.UrbanCommand = UrbanCommand;
//# sourceMappingURL=urban.js.map