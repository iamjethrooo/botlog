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
const discord_js_1 = require("discord.js");
const discord_js_utilities_1 = require("@sapphire/discord.js-utilities");
const axios_1 = __importDefault(require("axios"));
let AdviceCommand = class AdviceCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        await interaction.deferReply();
        const channel = interaction.channel;
        if (!channel)
            return await interaction.reply('Something went wrong :('); // type guard
        const subreddit = interaction.options.getString('subreddit', true);
        const sort = interaction.options.getString('sort', true);
        if (['controversial', 'top'].some(val => val === sort)) {
            const row = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageSelectMenu()
                .setCustomId('top_or_controversial')
                .setPlaceholder('Please select an option')
                .addOptions(optionsArray));
            const menu = await channel.send({
                content: `:loud_sound: Do you want to get the ${sort} posts from past hour/week/month/year or all?`,
                components: [row]
            });
            const collector = menu.createMessageComponentCollector({
                componentType: 'SELECT_MENU',
                time: 30000 // 30 sec
            });
            collector.on('end', () => {
                if (menu)
                    menu.delete().catch(console.error);
            });
            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    i.reply({
                        content: 'This element is not for you!',
                        ephemeral: true
                    });
                }
                else {
                    collector.stop();
                    const timeFilter = i.values[0];
                    this.fetchFromReddit(interaction, subreddit, sort, timeFilter);
                }
            });
        }
        else {
            this.fetchFromReddit(interaction, subreddit, sort);
        }
    }
    async fetchFromReddit(interaction, subreddit, sort, timeFilter = 'day') {
        try {
            var data = await this.getData(subreddit, sort, timeFilter);
        }
        catch (error) {
            return interaction.followUp(error);
        }
        interaction.followUp('Fetching data from reddit');
        const paginatedEmbed = new discord_js_utilities_1.PaginatedMessage();
        for (let i = 1; i <= data.children.length; i++) {
            let color = '#FE9004';
            let redditPost = data.children[i - 1];
            if (redditPost.data.title.length > 255) {
                redditPost.data.title = redditPost.data.title.substring(0, 252) + '...'; // max title length is 256
            }
            if (redditPost.data.over_18)
                color = '#cf00f'; // red - nsfw
            paginatedEmbed.addPageEmbed(embed => embed
                .setColor(color)
                .setTitle(redditPost.data.title)
                .setURL(`https://www.reddit.com${redditPost.data.permalink}`)
                .setDescription(`Upvotes: ${redditPost.data.score} :thumbsup: `)
                .setAuthor({ name: redditPost.data.author }));
        }
        const message = {
            author: {
                id: interaction.user.id,
                bot: interaction.user.bot
            },
            channel: interaction.channel
        };
        // @ts-ignore
        return paginatedEmbed.run(message);
    }
    getData(subreddit, sort, timeFilter) {
        return new Promise(async function (resolve, reject) {
            const response = await axios_1.default.get(`https://www.reddit.com/r/${subreddit}/${sort}/.json?limit=10&t=${timeFilter ? timeFilter : 'day'}`);
            const data = response.data.data;
            if (!data) {
                reject(`**${subreddit}** is a private subreddit!`);
            }
            else if (!data.children.length) {
                reject('Please provide a valid subreddit name!');
            }
            resolve(data);
        });
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'subreddit',
                    type: 'STRING',
                    required: true,
                    description: 'Subreddit name'
                },
                {
                    name: 'sort',
                    type: 'STRING',
                    required: true,
                    description: 'What posts do you want to see? Select from best/hot/top/new/controversial/rising',
                    choices: [
                        {
                            name: 'Best',
                            value: 'best'
                        },
                        {
                            name: 'Hot',
                            value: 'hot'
                        },
                        {
                            name: 'New',
                            value: 'new'
                        },
                        {
                            name: 'Top',
                            value: 'top'
                        },
                        {
                            name: 'Controversial',
                            value: 'controversial'
                        },
                        {
                            name: 'Rising',
                            value: 'rising'
                        }
                    ]
                }
            ]
        });
    }
};
AdviceCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'reddit',
        description: 'Get posts from reddit by specifying a subreddit',
        preconditions: ['GuildOnly']
    })
], AdviceCommand);
exports.AdviceCommand = AdviceCommand;
const optionsArray = [
    {
        label: 'hour',
        value: 'hour'
    },
    {
        label: 'week',
        value: 'week'
    },
    {
        label: 'month',
        value: 'month'
    },
    {
        label: 'year',
        value: 'year'
    },
    {
        label: 'all',
        value: 'all'
    }
];
//# sourceMappingURL=reddit.js.map