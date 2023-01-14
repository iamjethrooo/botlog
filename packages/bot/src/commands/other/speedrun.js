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
var SpeedRunCommand_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeedRunCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const discord_js_utilities_1 = require("@sapphire/discord.js-utilities");
const framework_1 = require("@sapphire/framework");
const axios_1 = __importDefault(require("axios"));
const discord_js_1 = require("discord.js");
let SpeedRunCommand = SpeedRunCommand_1 = class SpeedRunCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        var _a;
        const query = interaction.options.getString('game', true);
        let queryCat = interaction.options.getString('category', false);
        let initialRaw;
        try {
            initialRaw = await axios_1.default.get(`https://www.speedrun.com/api/v1/games?name=${query}`);
        }
        catch {
            return await interaction.reply('Something went wrong, please try again later');
        }
        const initial = initialRaw.data;
        if (!initial.data.length) {
            return await interaction.reply('No game was found.');
        }
        let gameID = initial.data[0].id;
        let response;
        try {
            response = await axios_1.default.get(`https://www.speedrun.com/api/v1/games/${gameID}/records?miscellaneous=no&scope=full-game&top=10&embed=game,category,players,platforms,regions`);
        }
        catch {
            return await interaction.reply('Something went wrong, please try again later');
        }
        const body = response.data;
        if (!body.data.length) {
            const gameNameArr = [];
            initial.data.slice(0, 6).forEach((id) => {
                gameNameArr.push(id.names.international);
            });
            let gameName = new discord_js_1.MessageEmbed()
                .setColor('#3E8657')
                .setTitle(':mag: Search Results')
                .setThumbnail(initial.data[0].assets['cover-medium'].uri)
                .addField(':x: Try searching again with the following suggestions.', initial.data[0].names.international + ` doesn't have any runs.`)
                .setTimestamp();
            gameNameArr.forEach((game, i) => {
                gameName.addField(`:video_game: Result ${i + 1}`, game);
            });
            interaction.reply({ embeds: [gameName] });
        }
        else {
            const categories = body.data;
            queryCat = !queryCat ? categories[0].category.data.name : queryCat;
            for (let i = 0; i <= categories.length; ++i) {
                if (((_a = categories[i]) === null || _a === void 0 ? void 0 : _a.category.data.name.toLowerCase()) ==
                    (queryCat === null || queryCat === void 0 ? void 0 : queryCat.toLowerCase())) {
                    break;
                }
                else if (i == categories.length)
                    queryCat = categories[0].category.data.name;
            }
            await interaction
                .reply({
                embeds: [
                    new discord_js_1.MessageEmbed()
                        .setColor('#3E8657')
                        .setDescription('Getting Data')
                ],
                fetchReply: true
            })
                .then(async () => {
                SpeedRunCommand_1.embedGenerator(categories, queryCat !== null && queryCat !== void 0 ? queryCat : categories[0].category.data.name)
                    .setIdle(30 * 1000)
                    .setIndex(0)
                    .run(interaction);
            });
        }
    }
    static myButtons(message, categories, queryCat) {
        categories.forEach((value, index) => {
            message.addAction({
                style: categories[index].category.data.name.toLowerCase() ==
                    queryCat.toLowerCase()
                    ? 'SUCCESS'
                    : 'PRIMARY',
                customId: `Category-${index}`,
                label: categories[index].category.data.name,
                type: discord_js_1.Constants.MessageComponentTypes.BUTTON,
                run: async ({ interaction }) => {
                    // message = new PaginatedMessage();
                    queryCat = categories[index].category.data.name;
                    message = SpeedRunCommand_1.embedGenerator(categories, queryCat);
                    try {
                        SpeedRunCommand_1.myButtons(message.setIndex(0).setIdle(30 * 1000), categories, queryCat);
                    }
                    catch (error) {
                        new discord_js_utilities_1.PaginatedMessage()
                            .addPageEmbed(new discord_js_1.MessageEmbed()
                            .setColor('RED')
                            .setTitle('Error')
                            .setDescription(error.toString()))
                            .run(interaction);
                    }
                    await interaction
                        .update({
                        embeds: [
                            new discord_js_1.MessageEmbed()
                                .setColor('#3E8657')
                                .setDescription('Getting Data')
                        ],
                        fetchReply: true
                    })
                        .then(async () => {
                        message.run(interaction);
                    });
                }
            });
        });
        return message;
    }
    static embedGenerator(categories, queryCat) {
        const PaginatedEmbed = new discord_js_utilities_1.PaginatedMessage();
        try {
            categories.forEach((category) => {
                if (category.category.data.name.toLowerCase() == (queryCat === null || queryCat === void 0 ? void 0 : queryCat.toLowerCase())) {
                    const catRules = new discord_js_1.MessageEmbed()
                        .setDescription(category.category.data.rules.toString().length
                        ? `**${category.category.data.name} Rules**:\n` +
                            category.category.data.rules.toString()
                        : 'No Data')
                        .setColor('#3E8657')
                        .setThumbnail(category.game.data.assets['cover-medium'].uri)
                        .setAuthor({
                        name: category.game.data.names.international +
                            ' - ' +
                            category.category.data.name,
                    });
                    PaginatedEmbed.addPageEmbed(catRules);
                    for (let i = 0; i <= category.players.data.length; ++i) {
                        const platform = category.platforms.data.length > 0
                            ? category.platforms.data[0].name
                            : '';
                        const region = category.regions.data.length > 0
                            ? ' - ' + category.regions.data[0].name
                            : '';
                        let emu = 'No Data';
                        let runnerName = 'No Data';
                        let trophyIcon = '';
                        if (category.runs[i]) {
                            emu = category.runs[i].run.system.emulated ? ' [EMU]' : '';
                            runnerName =
                                category.players.data[i].rel === 'user'
                                    ? category.players.data[i].names.international
                                    : category.players.data[i].name;
                            if (i == 0)
                                trophyIcon = '🏆 WR: ';
                            if (i == 1)
                                trophyIcon = '🥈 2nd: ';
                            if (i == 2)
                                trophyIcon = '🥉 3rd: ';
                            if (i >= 3)
                                trophyIcon = `${i + 1}th: `;
                        }
                        if (category.runs[i]) {
                            PaginatedEmbed.addPageEmbed(embeds => embeds
                                .setColor('#3E8657')
                                .setTitle(category.runs[i]
                                ? trophyIcon +
                                    SpeedRunCommand_1.convertTime(category.runs[i].run.times.primary_t) +
                                    ' by ' +
                                    runnerName
                                : 'No Data')
                                .setThumbnail(category.game.data.assets['cover-medium'].uri)
                                .setURL(category.runs[i]
                                ? category.runs[i].run.weblink
                                : category.weblink)
                                .setAuthor({
                                name: category.game.data.names.international +
                                    ' - ' +
                                    category.category.data.name,
                            })
                                .addField(':calendar_spiral: Date Played:', category.runs[i] ? category.runs[i].run.date : 'No Data')
                                .addField(':video_game: Played On:', platform + region + emu));
                        }
                    }
                }
            });
            PaginatedEmbed.setIdle(30 * 1000).setIndex(0);
            if (PaginatedEmbed.actions.size > 0)
                PaginatedEmbed.actions.delete('@sapphire/paginated-messages.goToPage');
            SpeedRunCommand_1.myButtons(PaginatedEmbed, categories, queryCat);
            return PaginatedEmbed;
        }
        catch (error) {
            return new discord_js_utilities_1.PaginatedMessage().addPageEmbed(new discord_js_1.MessageEmbed()
                .setColor('RED')
                .setTitle('Error')
                .setDescription(error.toString()));
        }
    }
    static convertTime(time) {
        let str, hr, min, sec, ms;
        let parts = time.toString().split('.');
        ms = parts.length > 1 ? parseInt((parts[1] + '00').slice(0, 3)) : undefined;
        sec = parseInt(parts[0]);
        if (sec >= 60) {
            min = Math.floor(sec / 60);
            sec = sec % 60;
            sec = sec < 10 ? '0' + sec : sec;
        }
        if (min >= 60) {
            hr = Math.floor(min / 60);
            min = min % 60;
            min = min < 10 ? '0' + min : min;
        }
        if (ms && ms < 10)
            ms = '00' + ms;
        else if (ms && ms < 100)
            ms = '0' + ms;
        if (min == undefined) {
            str =
                ms == undefined
                    ? sec.toString() + 's'
                    : sec.toString() + 's ' + ms.toString() + 'ms';
        }
        else if (hr === undefined) {
            str =
                ms === undefined
                    ? min.toString() + 'm ' + sec.toString() + 's'
                    : min.toString() +
                        'm ' +
                        sec.toString() +
                        's ' +
                        ms.toString() +
                        'ms';
        }
        else {
            str =
                ms === undefined
                    ? hr.toString() + 'h ' + min.toString() + 'm ' + sec.toString() + 's'
                    : hr.toString() +
                        'h ' +
                        min.toString() +
                        'm ' +
                        sec.toString() +
                        's ' +
                        ms.toString() +
                        'ms';
        }
        return str;
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    type: 'STRING',
                    required: true,
                    name: 'game',
                    description: 'Video Game Title?'
                },
                {
                    type: 'STRING',
                    required: false,
                    name: 'category',
                    description: 'speed run Category?'
                }
            ]
        });
    }
};
SpeedRunCommand = SpeedRunCommand_1 = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'speedrun',
        description: 'Look for the world record of a game!'
    })
], SpeedRunCommand);
exports.SpeedRunCommand = SpeedRunCommand;
//# sourceMappingURL=speedrun.js.map