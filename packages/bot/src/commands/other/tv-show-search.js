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
exports.TVShowSearchCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_utilities_1 = require("@sapphire/discord.js-utilities");
const axios_1 = __importDefault(require("axios"));
let TVShowSearchCommand = class TVShowSearchCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        const query = interaction.options.getString('query', true);
        try {
            var data = await this.getData(query);
        }
        catch (error) {
            return await interaction.reply(error);
        }
        const PaginatedEmbed = new discord_js_utilities_1.PaginatedMessage();
        for (let i = 0; i < data.length; i++) {
            const showInfo = this.constructInfoObject(data[i].show);
            PaginatedEmbed.addPageEmbed(embed => embed
                .setTitle(showInfo.name)
                .setURL(showInfo.url)
                .setColor('#17a589')
                .setThumbnail(showInfo.thumbnail)
                .setDescription(showInfo.summary)
                .addField('Language', showInfo.language, true)
                .addField('Genre(s)', showInfo.genres, true)
                .addField('Show Type', showInfo.type, true)
                .addField('Premiered', showInfo.premiered, true)
                .addField('Network', showInfo.network, true)
                .addField('Runtime', showInfo.runtime, true)
                .addField('Average Rating', showInfo.rating)
                .setFooter({
                text: `(Page ${i}/${data.length}) Powered by tvmaze.com`,
                iconURL: 'https://static.tvmaze.com/images/favico/favicon-32x32.png'
            }));
        }
        await interaction.reply('Show info');
        // @ts-ignore
        return PaginatedEmbed.run(interaction);
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'query',
                    description: 'What TV show do you want to look up?',
                    type: 'STRING',
                    required: true
                }
            ]
        });
    }
    getData(query) {
        return new Promise(async function (resolve, reject) {
            const url = `http://api.tvmaze.com/search/shows?q=${encodeURI(query)}`;
            try {
                const response = await axios_1.default.get(url);
                if (response.status == 429) {
                    reject(':x: Rate Limit exceeded. Please try again in a few minutes.');
                }
                if (response.status == 503) {
                    reject(':x: The service is currently unavailable. Please try again later.');
                }
                if (response.status !== 200) {
                    reject('There was a problem getting data from the API, make sure you entered a valid TV show name');
                }
                const data = response.data;
                if (!data.length) {
                    reject('There was a problem getting data from the API, make sure you entered a valid TV show name');
                }
                resolve(data);
            }
            catch (e) {
                console.error(e);
                reject('There was a problem getting data from the API, make sure you entered a valid TV show name');
            }
        });
    }
    constructInfoObject(show) {
        return {
            name: show.name,
            url: show.url,
            summary: this.filterSummary(show.summary),
            language: this.checkIfNull(show.language),
            genres: this.checkGenres(show.genres),
            type: this.checkIfNull(show.type),
            premiered: this.checkIfNull(show.premiered),
            network: this.checkNetwork(show.network),
            runtime: show.runtime ? show.runtime + ' Minutes' : 'None Listed',
            rating: show.ratings ? show.rating.average : 'None Listed',
            thumbnail: show.image
                ? show.image.original
                : 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png'
        };
    }
    filterSummary(summary) {
        return summary
            .replace(/<(\/)?b>/g, '**')
            .replace(/<(\/)?i>/g, '*')
            .replace(/<(\/)?p>/g, '')
            .replace(/<br>/g, '\n')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'");
    }
    checkGenres(genres) {
        if (Array.isArray(genres)) {
            if (genres.join(' ').trim().length == 0)
                return 'None Listed';
            return genres.join(' ');
        }
        else if (!genres.length) {
            return 'None Listed';
        }
        return genres;
    }
    checkIfNull(value) {
        if (!value) {
            return 'None Listed';
        }
        return value;
    }
    checkNetwork(network) {
        if (!network)
            return 'None Listed';
        return `(**${network.country.code}**) ${network.name}`;
    }
};
TVShowSearchCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'tv-show-search',
        description: 'Get TV shows information',
        preconditions: ['GuildOnly']
    })
], TVShowSearchCommand);
exports.TVShowSearchCommand = TVShowSearchCommand;
//# sourceMappingURL=tv-show-search.js.map