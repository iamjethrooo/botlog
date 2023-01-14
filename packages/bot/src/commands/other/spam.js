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
exports.SpamCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const { Util: { splitMessage } } = require('discord.js');
const node_fetch_1 = __importDefault(require("node-fetch"));
let SpamCommand = class SpamCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        if (interaction.channelId != '682838969179832423') {
            return await interaction.reply({ ephemeral: true, content: 'You can\'t use that command here!' });
        }
        (0, node_fetch_1.default)('https://www.reddit.com/r/copypasta/new.json?sort=top', {
            method: 'GET',
        })
            .then(res => res.json())
            .then(json => {
            const rand = Math.floor(Math.random() * json.data.dist);
            const split = splitMessage(json.data.children[rand].data.selftext);
            for (let s of split) {
                interaction.channel.send(s);
            }
            return;
        })
            .catch(err => {
            interaction.reply('An error occured!');
            return console.error(err);
        });
    }
    async messageRun(message) {
        if (message.channel.id != '682838969179832423') {
            return;
        }
        (0, node_fetch_1.default)('https://www.reddit.com/r/copypasta/new.json?sort=top', {
            method: 'GET',
        })
            .then(res => res.json())
            .then(json => {
            const rand = Math.floor(Math.random() * json.data.dist);
            const split = splitMessage(json.data.children[rand].data.selftext);
            for (let s of split) {
                message.channel.send(s);
            }
            return;
        })
            .catch(err => {
            message.reply('An error occured!');
            return console.error(err);
        });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
SpamCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'spam',
        description: 'spamspamspamspamspamspamspam'
    })
], SpamCommand);
exports.SpamCommand = SpamCommand;
//# sourceMappingURL=spam.js.map