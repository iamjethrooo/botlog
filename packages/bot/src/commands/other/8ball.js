"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EightBallCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const fs = __importStar(require("fs"));
let EightBallCommand = class EightBallCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        const question = interaction.options.getString('question', true);
        if (question.length > 255) {
            return await interaction.reply('Please ask a shorter question!');
        }
        const possibleAnswers = fs.readFileSync('././src/resources/other/8ball.json', 'utf-8');
        const answersArray = JSON.parse(possibleAnswers).answers;
        const randomAnswer = answersArray[Math.floor(Math.random() * answersArray.length)];
        const answerEmbed = new discord_js_1.MessageEmbed()
            .setTitle(question)
            .setAuthor({
            name: 'Magic 8 Ball',
            iconURL: 'https://i.imgur.com/HbwMhWM.png'
        })
            .setDescription(randomAnswer)
            .setColor('#000000')
            .setTimestamp();
        return await interaction.reply({ embeds: [answerEmbed] });
    }
    async messageRun(message, args) {
        const question = await args.rest('string');
        if (question.length > 255) {
            return await message.reply('Please ask a shorter question!');
        }
        const possibleAnswers = fs.readFileSync('././src/resources/other/8ball.json', 'utf-8');
        const answersArray = JSON.parse(possibleAnswers).answers;
        const randomAnswer = answersArray[Math.floor(Math.random() * answersArray.length)];
        const answerEmbed = new discord_js_1.MessageEmbed()
            .setTitle(question)
            .setAuthor({
            name: 'Magic 8 Ball',
            iconURL: 'https://i.imgur.com/HbwMhWM.png'
        })
            .setDescription(randomAnswer)
            .setColor('#000000')
            .setTimestamp();
        return await message.reply({ embeds: [answerEmbed] });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    type: 'STRING',
                    required: true,
                    name: 'question',
                    description: 'What question do you want to ask the magic ball?'
                }
            ]
        });
    }
};
EightBallCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: '8ball',
        description: 'Get the answer to anything!',
    })
], EightBallCommand);
exports.EightBallCommand = EightBallCommand;
//# sourceMappingURL=8ball.js.map