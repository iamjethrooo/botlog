"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
let RandomCommand = class RandomCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        const min = Math.ceil(interaction.options.getInteger('min', true));
        const max = Math.floor(interaction.options.getInteger('max', true));
        const rngEmbed = new discord_js_1.MessageEmbed().setTitle(`${Math.floor(Math.random() * (max - min + 1)) + min}`);
        return await interaction.reply({ embeds: [rngEmbed] });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    type: 'INTEGER',
                    required: true,
                    name: 'min',
                    description: 'What is the minimum number?'
                },
                {
                    type: 'INTEGER',
                    required: true,
                    name: 'max',
                    description: 'What is the maximum number?'
                }
            ]
        });
    }
};
RandomCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'random',
        description: 'Generate a random number between two inputs!'
    })
], RandomCommand);
exports.RandomCommand = RandomCommand;
//# sourceMappingURL=random.js.map