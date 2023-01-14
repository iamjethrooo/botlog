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
exports.TranslateCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const google_translate_api_x_1 = __importDefault(require("google-translate-api-x"));
const logger_1 = __importDefault(require("../../lib/utils/logger"));
let TranslateCommand = class TranslateCommand extends framework_1.Command {
    chatInputRun(interaction) {
        const targetLang = interaction.options.getString('target', true);
        const text = interaction.options.getString('text', true);
        (0, google_translate_api_x_1.default)(text, {
            to: targetLang,
            requestFunction: 'axios'
        })
            .then(async (response) => {
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#770000')
                .setTitle('Google Translate')
                .setURL('https://translate.google.com/')
                .setDescription(response.text)
                .setFooter({
                iconURL: 'https://i.imgur.com/ZgFxIwe.png',
                text: 'Powered by Google Translate'
            });
            return await interaction.reply({ embeds: [embed] });
        })
            .catch(async (error) => {
            logger_1.default.error(error);
            return await interaction.reply(':x: Something went wrong when trying to translate the text');
        });
    }
    registerApplicationCommands(registry) {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'target',
                    type: 'STRING',
                    required: true,
                    description: 'What is the target language?(language you want to translate to)'
                },
                {
                    name: 'text',
                    type: 'STRING',
                    required: true,
                    description: 'What text do you want to translate?'
                }
            ]
        });
    }
};
TranslateCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'translate',
        description: 'Translate from any language to any language using Google Translate',
        preconditions: ['GuildOnly', 'isCommandDisabled', 'validateLanguageCode']
    })
], TranslateCommand);
exports.TranslateCommand = TranslateCommand;
//# sourceMappingURL=translate.js.map