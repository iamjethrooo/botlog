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
exports.AdviceCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const axios_1 = __importDefault(require("axios"));
let AdviceCommand = class AdviceCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        axios_1.default
            .get('https://api.adviceslip.com/advice')
            .then(async (response) => {
            const advice = response.data.slip.advice;
            return await interaction.reply(advice);
        })
            .catch(async (error) => {
            console.error(error);
            return await interaction.reply('Something went wrong when asking for advice :(');
        });
    }
    async messageRun(message) {
        axios_1.default
            .get('https://api.adviceslip.com/advice')
            .then(async (response) => {
            const advice = response.data.slip.advice;
            return await message.reply(advice);
        })
            .catch(async (error) => {
            console.error(error);
            return await message.reply('Something went wrong when asking for advice :(');
        });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
AdviceCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'advice',
        description: 'Get some advice!'
    })
], AdviceCommand);
exports.AdviceCommand = AdviceCommand;
//# sourceMappingURL=advice.js.map