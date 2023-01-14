"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlayerEmbed = void 0;
const time_utilities_1 = require("@sapphire/time-utilities");
const framework_1 = require("@sapphire/framework");
const NowPlayingEmbed_1 = require("./NowPlayingEmbed");
const logger_1 = __importDefault(require("../logger"));
async function buttonsCollector(message, song) {
    const { client } = framework_1.container;
    const queue = client.music.queues.get(message.guildId);
    const channel = await queue.getTextChannel();
    const collector = message.createMessageComponentCollector();
    if (!channel)
        return;
    const maxLimit = time_utilities_1.Time.Minute * 30;
    let timer;
    collector.on('collect', async (i) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!((_b = (_a = message.member) === null || _a === void 0 ? void 0 : _a.voice.channel) === null || _b === void 0 ? void 0 : _b.members.has(i.user.id)))
            return await i.reply({
                content: `:x: Only available to members in ${(_c = message.member) === null || _c === void 0 ? void 0 : _c.voice.channel} <-- Click To Join`,
                ephemeral: true
            });
        if (i.customId === 'playPause') {
            if (queue.paused) {
                await queue.resume();
                clearTimeout(client.leaveTimers[queue.guildID]);
            }
            else {
                client.leaveTimers[queue.guildID] = setTimeout(async () => {
                    await channel.send(':zzz: Leaving due to inactivity');
                    await queue.leave();
                }, maxLimit);
                await queue.pause();
            }
            const tracks = await queue.tracks();
            const NowPlaying = new NowPlayingEmbed_1.NowPlayingEmbed(song, queue.player.accuratePosition, (_e = (_d = queue.player.trackData) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0, queue.player.volume, tracks, tracks.at(-1), queue.player.paused);
            collector.empty();
            return await i.update({
                embeds: [await NowPlaying.NowPlayingEmbed()]
            });
        }
        if (i.customId === 'stop') {
            clearTimeout(timer);
            await queue.leave();
            return;
        }
        if (i.customId === 'next') {
            clearTimeout(timer);
            await queue.next({ skipped: true });
            return;
        }
        if (i.customId === 'volumeUp') {
            const currentVolume = await queue.getVolume();
            const volume = currentVolume + 10 > 200 ? 200 : currentVolume + 10;
            await queue.setVolume(volume);
            const tracks = await queue.tracks();
            const NowPlaying = new NowPlayingEmbed_1.NowPlayingEmbed(song, queue.player.accuratePosition, (_g = (_f = queue.player.trackData) === null || _f === void 0 ? void 0 : _f.length) !== null && _g !== void 0 ? _g : 0, queue.player.volume, tracks, tracks.at(-1), queue.player.paused);
            collector.empty();
            await i.update({
                embeds: [await NowPlaying.NowPlayingEmbed()]
            });
            return;
        }
        if (i.customId === 'volumeDown') {
            const currentVolume = await queue.getVolume();
            const volume = currentVolume - 10 < 0 ? 0 : currentVolume - 10;
            await queue.setVolume(volume);
            const tracks = await queue.tracks();
            const NowPlaying = new NowPlayingEmbed_1.NowPlayingEmbed(song, queue.player.accuratePosition, (_j = (_h = queue.player.trackData) === null || _h === void 0 ? void 0 : _h.length) !== null && _j !== void 0 ? _j : 0, queue.player.volume, tracks, tracks.at(-1), queue.player.paused);
            collector.empty();
            await i.update({ embeds: [await NowPlaying.NowPlayingEmbed()] });
            return;
        }
    });
    collector.on('end', async () => {
        clearTimeout(timer);
    });
    return collector;
}
exports.default = buttonsCollector;
async function deletePlayerEmbed(queue) {
    const embedID = await queue.getEmbed();
    if (embedID) {
        const channel = await queue.getTextChannel();
        await (channel === null || channel === void 0 ? void 0 : channel.messages.fetch(embedID).then(async (oldMessage) => {
            if (oldMessage)
                await oldMessage
                    .delete()
                    .catch(error => logger_1.default.error('Failed to Delete Old Message. ' + error));
            await queue.deleteEmbed();
        }));
    }
}
exports.deletePlayerEmbed = deletePlayerEmbed;
//# sourceMappingURL=buttonsCollector.js.map