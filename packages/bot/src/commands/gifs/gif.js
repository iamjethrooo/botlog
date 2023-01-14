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
exports.GifCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
let GifCommand = class GifCommand extends framework_1.Command {
    chatInputRun(interaction) {
        axios_1.default
            .get(`https://api.tenor.com/v1/random?key=${process.env.TENOR_API}&q=gif&limit=1`)
            .then(async (response) => {
            return await interaction.reply({
                content: response.data.results[0].url
            });
        })
            .catch(async (error) => {
            console.error(error);
            return await interaction.reply('Something went wrong when trying to fetch a gif meme :(');
        });
    }
    async messageRun(message) {
        axios_1.default
            .get(`https://api.tenor.com/v1/random?key=${process.env.TENOR_API}&q=gif&limit=1`)
            .then(async (response) => {
            return await message.reply({
                content: response.data.results[0].url
            });
        })
            .catch(async (error) => {
            console.error(error);
            return await message.reply('Something went wrong when trying to fetch a gif meme :(');
        });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
GifCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'gif',
        description: 'Replies with a random gif meme!'
    })
], GifCommand);
exports.GifCommand = GifCommand;
//# sourceMappingURL=gif.js.map