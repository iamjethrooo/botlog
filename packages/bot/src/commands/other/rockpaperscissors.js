"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RockPaperScissorsCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
let RockPaperScissorsCommand = class RockPaperScissorsCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        const move = interaction.options.getString('move', true);
        const resultMessage = this.rpsLogic(move);
        const embed = new discord_js_1.MessageEmbed()
            .setColor('RANDOM')
            .setTitle('Rock, Paper, Scissors')
            .setDescription(`**${resultMessage[0]}**, I formed ${resultMessage[1]}`);
        return await interaction.reply({ embeds: [embed] });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'move',
                    type: 'STRING',
                    required: true,
                    description: 'What is your move?',
                    choices: [
                        { name: 'Rock', value: 'rock' },
                        { name: 'Paper', value: 'paper' },
                        { name: 'Scissors', value: 'scissors' }
                    ]
                }
            ]
        }, {
            behaviorWhenNotIdentical: framework_1.RegisterBehavior.Overwrite
        });
    }
    rpsLogic(player_move) {
        const bot_move = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
        if (player_move === 'rock') {
            if (bot_move === 'rock') {
                return ['Tie!', 'Rock'];
            }
            if (bot_move === 'paper') {
                return ['I win!', 'Paper'];
            }
            return ['You win!', 'Scissors'];
        }
        else if (player_move === 'paper') {
            if (bot_move === 'rock') {
                return ['You win!', 'Rock'];
            }
            if (bot_move === 'paper') {
                return ['Tie!', 'Paper'];
            }
            return ['I win!', 'Scissors'];
        }
        else {
            if (bot_move === 'rock') {
                return ['I win!', 'Rock'];
            }
            if (bot_move === 'paper') {
                return ['You win!', 'Paper'];
            }
            return ['Tie!', 'Scissors'];
        }
    }
};
RockPaperScissorsCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'rockpaperscissors',
        description: 'Play rock paper scissors with me!'
    })
], RockPaperScissorsCommand);
exports.RockPaperScissorsCommand = RockPaperScissorsCommand;
//# sourceMappingURL=rockpaperscissors.js.map