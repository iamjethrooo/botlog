"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("../trpc");
const user_1 = require("./user");
const guild_1 = require("./guild");
const playlist_1 = require("./playlist");
const song_1 = require("./song");
const twitch_1 = require("./twitch");
const channel_1 = require("./channel");
const welcome_1 = require("./welcome");
const command_1 = require("./command");
const hub_1 = require("./hub");
const reminder_1 = require("./reminder");
/**
 * Create your application's root router
 * If you want to use SSG, you need export this
 * @link https://trpc.io/docs/ssg
 * @link https://trpc.io/docs/router
 */
exports.appRouter = trpc_1.t.router({
    user: user_1.userRouter,
    guild: guild_1.guildRouter,
    playlist: playlist_1.playlistRouter,
    song: song_1.songRouter,
    twitch: twitch_1.twitchRouter,
    channel: channel_1.channelRouter,
    welcome: welcome_1.welcomeRouter,
    command: command_1.commandRouter,
    hub: hub_1.hubRouter,
    reminder: reminder_1.reminderRouter
});
//# sourceMappingURL=index.js.map