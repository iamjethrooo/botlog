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
exports.GameSearchCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_utilities_1 = require("@sapphire/discord.js-utilities");
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
let GameSearchCommand = class GameSearchCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        if (!process.env.RAWG_API)
            return await interaction.reply(':x: Command is Disabled - Missing API Key');
        const title = interaction.options.getString('game', true);
        const filteredTitle = this.filterTitle(title);
        try {
            var data = await this.getGameDetails(filteredTitle);
        }
        catch (error) {
            return await interaction.reply(error);
        }
        const PaginatedEmbed = new discord_js_utilities_1.PaginatedMessage();
        const firstPageTuple = []; // releaseDate, esrbRating, userRating
        if (data.tba) {
            firstPageTuple.push('TBA');
        }
        else if (!data.released) {
            firstPageTuple.push('None Listed');
        }
        else {
            firstPageTuple.push(data.released);
        }
        if (!data.esrb_rating) {
            firstPageTuple.push('None Listed');
        }
        else {
            firstPageTuple.push(data.esrb_rating.name);
        }
        if (!data.rating) {
            firstPageTuple.push('None Listed');
        }
        else {
            firstPageTuple.push(data.rating + '/5');
        }
        PaginatedEmbed.addPageEmbed(embed => embed
            .setTitle(`Game info: ${data.name}`)
            .setDescription('**Game Description**\n' + data.description_raw.slice(0, 2000) + '...')
            .setColor('#b5b5b5')
            .setThumbnail(data.background_image)
            .addField('Released', firstPageTuple[0], true)
            .addField('ESRB Rating', firstPageTuple[1], true)
            .addField('Score', firstPageTuple[2], true)
            .setTimestamp());
        const developerArray = [];
        if (data.developers.length) {
            for (let i = 0; i < data.developers.length; ++i) {
                developerArray.push(data.developers[i].name);
            }
        }
        else {
            developerArray.push('None Listed');
        }
        const publisherArray = [];
        if (data.publishers.length) {
            for (let i = 0; i < data.publishers.length; ++i) {
                publisherArray.push(data.publishers[i].name);
            }
        }
        else {
            publisherArray.push('None Listed');
        }
        const platformArray = [];
        if (data.platforms.length) {
            for (let i = 0; i < data.platforms.length; ++i) {
                platformArray.push(data.platforms[i].platform.name);
            }
        }
        else {
            platformArray.push('None Listed');
        }
        const genreArray = [];
        if (data.genres.length) {
            for (let i = 0; i < data.genres.length; ++i) {
                genreArray.push(data.genres[i].name);
            }
        }
        else {
            genreArray.push('None Listed');
        }
        const retailerArray = [];
        if (data.stores.length) {
            for (let i = 0; i < data.stores.length; ++i) {
                retailerArray.push(`[${data.stores[i].store.name}](${data.stores[i].url})`);
            }
        }
        else {
            retailerArray.push('None Listed');
        }
        PaginatedEmbed.addPageEmbed(embed => {
            var _a;
            return embed
                .setTitle(`Game info: ${data.name}`)
                .setColor('#b5b5b5')
                .setThumbnail((_a = data.background_image_additional) !== null && _a !== void 0 ? _a : data.background_image)
                // Row 1
                .addField('Developer(s)', developerArray.toString().replace(/,/g, ', '), true)
                .addField('Publisher(s)', publisherArray.toString().replace(/,/g, ', '), true)
                .addField('Platform(s)', platformArray.toString().replace(/,/g, ', '), true)
                // Row 2
                .addField('Genre(s)', genreArray.toString().replace(/,/g, ', '), true)
                .addField('Retailer(s)', retailerArray.toString().replace(/,/g, ', ').replace(/`/g, ''))
                .setTimestamp();
        });
        // await interaction.reply('');
        // @ts-ignore
        return PaginatedEmbed.run(interaction);
    }
    registerApplicationCommands(registery) {
        if (!process.env.RAWG_API) {
            return console.log('Game-Search-Command - Disabled');
        }
        else
            console.log('Game-Search-Command - Enabled');
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'game',
                    description: 'What game do you want to look up?',
                    required: true,
                    type: 'STRING'
                }
            ]
        });
    }
    filterTitle(title) {
        return title.replace(/ /g, '-').replace(/' /g, '').toLowerCase();
    }
    getGameDetails(query) {
        return new Promise(async function (resolve, reject) {
            const url = `https://api.rawg.io/api/games/${query}?key=${process.env.RAWG_API}`;
            try {
                const response = await axios_1.default.get(url);
                if (response.status === 429) {
                    reject(':x: Rate Limit exceeded. Please try again in a few minutes.');
                }
                if (response.status === 503) {
                    reject(':x: The service is currently unavailable. Please try again later.');
                }
                if (response.status === 404) {
                    reject(`:x: Error: ${query} was not found`);
                }
                if (response.status !== 200) {
                    reject(':x: There was a problem getting data from the API, make sure you entered a valid game tittle');
                }
                let data = response.data;
                if (data.redirect) {
                    const redirect = await axios_1.default.get(`https://api.rawg.io/api/games/${data.slug}?key=${process.env.RAWG_API}`);
                    data = redirect.data;
                }
                // 'id' is the only value that must be present to all valid queries
                if (!data.id) {
                    reject(':x: There was a problem getting data from the API, make sure you entered a valid game title');
                }
                resolve(data);
            }
            catch (e) {
                console.error(e);
                reject('There was a problem getting data from the API, make sure you entered a valid game title');
            }
        });
    }
};
GameSearchCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'game-search',
        description: 'Search for video game information'
    })
], GameSearchCommand);
exports.GameSearchCommand = GameSearchCommand;
//# sourceMappingURL=game-search.js.map