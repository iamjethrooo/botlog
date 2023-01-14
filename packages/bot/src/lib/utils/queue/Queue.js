"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = exports.LoopType = void 0;
const framework_1 = require("@sapphire/framework");
const time_utilities_1 = require("@sapphire/time-utilities");
const utilities_1 = require("@sapphire/utilities");
const buttonsCollector_1 = require("../music/buttonsCollector");
const logger_1 = __importDefault(require("../logger"));
const trpc_1 = require("../../../trpc");
var LoopType;
(function (LoopType) {
    LoopType[LoopType["None"] = 0] = "None";
    LoopType[LoopType["Queue"] = 1] = "Queue";
    LoopType[LoopType["Song"] = 2] = "Song";
})(LoopType = exports.LoopType || (exports.LoopType = {}));
const kExpireTime = time_utilities_1.Time.Day * 2;
class Queue {
    constructor(store, guildID) {
        this.store = store;
        this.guildID = guildID;
        this.keys = {
            current: `music.${this.guildID}.current`,
            next: `music.${this.guildID}.next`,
            position: `music.${this.guildID}.position`,
            skips: `music.${this.guildID}.skips`,
            systemPause: `music.${this.guildID}.systemPause`,
            replay: `music.${this.guildID}.replay`,
            volume: `music.${this.guildID}.volume`,
            text: `music.${this.guildID}.text`,
            embed: `music.${this.guildID}.embed`
        };
        this.skipped = false;
    }
    get client() {
        return framework_1.container.client;
    }
    get player() {
        return this.store.client.players.get(this.guildID);
    }
    get playing() {
        return this.player.playing;
    }
    get paused() {
        return this.player.paused;
    }
    get guild() {
        return this.client.guilds.cache.get(this.guildID);
    }
    get voiceChannel() {
        var _a;
        const id = this.voiceChannelID;
        return id
            ? (_a = this.guild.channels.cache.get(id)) !== null && _a !== void 0 ? _a : null
            : null;
    }
    get voiceChannelID() {
        var _a;
        if (!this.player)
            return null;
        return (_a = this.player.channelId) !== null && _a !== void 0 ? _a : null;
    }
    createPlayer() {
        let player = this.player;
        if (!player) {
            player = this.store.client.createPlayer(this.guildID);
            player.on('trackEnd', async () => {
                if (!this.skipped) {
                    await this.next();
                }
                this.skipped = false;
            });
        }
        return player;
    }
    destroyPlayer() {
        if (this.player) {
            this.store.client.destroyPlayer(this.guildID);
        }
    }
    // Start the queue
    async start(replaying = false) {
        const np = await this.nowPlaying();
        if (!np)
            return this.next();
        try {
            this.player.setVolume(await this.getVolume());
            await this.player.play(np.song);
        }
        catch (err) {
            logger_1.default.error(err);
            await this.leave();
        }
        this.client.emit(replaying ? 'musicSongReplay' : 'musicSongPlay', this, np.song);
        return true;
    }
    // Returns whether or not there are songs that can be played
    async canStart() {
        return ((await this.store.redis.exists(this.keys.current, this.keys.next)) > 0);
    }
    // add tracks to queue
    async add(songs, options = {}) {
        songs = Array.isArray(songs) ? songs : [songs];
        if (!songs.length)
            return 0;
        await this.store.redis.lpush(this.keys.next, ...songs.map(song => this.stringifySong(song)));
        await this.refresh();
        return songs.length;
    }
    async pause(interaction) {
        await this.player.pause(true);
        await this.setSystemPaused(false);
        if (interaction) {
            this.client.emit('musicSongPause', interaction);
        }
    }
    async resume(interaction) {
        await this.player.pause(false);
        await this.setSystemPaused(false);
        if (interaction) {
            this.client.emit('musicSongResume', interaction);
        }
    }
    async getSystemPaused() {
        return await this.store.redis
            .get(this.keys.systemPause)
            .then(d => d === '1');
    }
    async setSystemPaused(value) {
        await this.store.redis.set(this.keys.systemPause, value ? '1' : '0');
        await this.refresh();
        return value;
    }
    /**
     * Retrieves whether or not the system should repeat the current track.
     */
    async getReplay() {
        return await this.store.redis.get(this.keys.replay).then(d => d === '1');
    }
    async setReplay(value) {
        await this.store.redis.set(this.keys.replay, value ? '1' : '0');
        await this.refresh();
        this.client.emit('musicReplayUpdate', this, value);
        return value;
    }
    /**
     * Retrieves the volume of the track in the queue.
     */
    async getVolume() {
        var _a;
        let data = await this.store.redis.get(this.keys.volume);
        if (!data) {
            const guildQuery = await trpc_1.trpcNode.guild.getGuild.query({
                id: this.guildID
            });
            if (!guildQuery || !guildQuery.guild)
                await this.setVolume((_a = this.player.volume) !== null && _a !== void 0 ? _a : 100); // saves to both
            if (guildQuery.guild)
                data =
                    guildQuery.guild.volume.toString() || this.player.volume.toString();
        }
        return data ? Number(data) : 100;
    }
    // set the volume of the track in the queue
    async setVolume(value) {
        await this.player.setVolume(value);
        const previous = await this.store.redis.getset(this.keys.volume, value);
        await this.refresh();
        await trpc_1.trpcNode.guild.updateVolume.mutate({
            guildId: this.guildID,
            volume: this.player.volume
        });
        this.client.emit('musicSongVolumeUpdate', this, value);
        return {
            previous: previous === null ? 100 : Number(previous),
            next: value
        };
    }
    async seek(position) {
        await this.player.seek(position);
    }
    // connect to a voice channel
    async connect(channelID) {
        await this.player.connect(channelID, { deafened: true });
    }
    // leave the voice channel
    async leave() {
        if (await this.getEmbed()) {
            await (0, buttonsCollector_1.deletePlayerEmbed)(this);
        }
        if (this.client.leaveTimers[this.guildID]) {
            clearTimeout(this.client.leaveTimers[this.player.guildId]);
            delete this.client.leaveTimers[this.player.guildId];
        }
        if (!this.player)
            return;
        await this.player.disconnect();
        await this.destroyPlayer();
        await this.setTextChannelID(null);
        await this.clear();
    }
    async getTextChannel() {
        var _a;
        const id = await this.getTextChannelID();
        if (id === null)
            return null;
        const channel = (_a = this.guild.channels.cache.get(id)) !== null && _a !== void 0 ? _a : null;
        if (channel === null) {
            await this.setTextChannelID(null);
            return null;
        }
        return channel;
    }
    getTextChannelID() {
        return this.store.redis.get(this.keys.text);
    }
    async setTextChannelID(channelID) {
        if (channelID === null) {
            await this.store.redis.del(this.keys.text);
        }
        else {
            await this.store.redis.set(this.keys.text, channelID);
            await this.refresh();
        }
        return channelID;
    }
    async getCurrentTrack() {
        const value = await this.store.redis.get(this.keys.current);
        return value ? this.parseSongString(value) : null;
    }
    async getAt(index) {
        const value = await this.store.redis.lindex(this.keys.next, -index - 1);
        return value ? this.parseSongString(value) : undefined;
    }
    async removeAt(position) {
        await this.store.redis.lremat(this.keys.next, -position - 1);
        await this.refresh();
    }
    async next({ skipped = false } = {}) {
        if (skipped)
            this.skipped = true;
        // Sets the current position to 0.
        await this.store.redis.del(this.keys.position);
        // Get whether or not the queue is on replay mode.
        const replaying = await this.getReplay();
        // If not skipped (song ended) and is replaying, replay.
        if (!skipped && replaying) {
            return await this.start(true);
        }
        // If it was skipped, set replay back to false.
        if (replaying)
            await this.setReplay(false);
        // Removes the next entry from the list and sets it as the current track.
        const entry = await this.store.redis.rpopset(this.keys.next, this.keys.current);
        // If there was an entry to play, refresh the state and start playing.
        if (entry) {
            await this.refresh();
            return this.start(false);
        }
        else {
            // If there was no entry, disconnect from the voice channel.
            await this.leave();
            this.client.emit('musicFinish', this, true);
            return false;
        }
    }
    count() {
        return this.store.redis.llen(this.keys.next);
    }
    async moveTracks(from, to) {
        await this.store.redis.lmove(this.keys.next, -from - 1, -to - 1); // work from the end of the list, since it's reversed
        await this.refresh();
    }
    async shuffleTracks() {
        await this.store.redis.lshuffle(this.keys.next, Date.now());
        await this.refresh();
    }
    async stop() {
        await this.player.stop();
    }
    async clearTracks() {
        await this.store.redis.del(this.keys.next);
    }
    async skipTo(position) {
        await this.store.redis.ltrim(this.keys.next, 0, position - 1);
        await this.next({ skipped: true });
    }
    refresh() {
        return this.store.redis
            .pipeline()
            .pexpire(this.keys.next, kExpireTime)
            .pexpire(this.keys.position, kExpireTime)
            .pexpire(this.keys.current, kExpireTime)
            .pexpire(this.keys.skips, kExpireTime)
            .pexpire(this.keys.systemPause, kExpireTime)
            .pexpire(this.keys.replay, kExpireTime)
            .pexpire(this.keys.volume, kExpireTime)
            .pexpire(this.keys.text, kExpireTime)
            .pexpire(this.keys.embed, kExpireTime)
            .exec();
    }
    clear() {
        return this.store.redis.del(this.keys.next, this.keys.position, this.keys.current, this.keys.skips, this.keys.systemPause, this.keys.replay, this.keys.volume, this.keys.text, this.keys.embed);
    }
    async nowPlaying() {
        const [entry, position] = await Promise.all([
            this.getCurrentTrack(),
            this.store.redis.get(this.keys.position)
        ]);
        if (entry === null)
            return null;
        return {
            song: entry,
            position: (0, utilities_1.isNullish)(position) ? 0 : parseInt(position, 10)
        };
    }
    async tracks(start = 0, end = -1) {
        if (end === Infinity)
            end = -1;
        const tracks = await this.store.redis.lrange(this.keys.next, start, end);
        return [...tracks].map(this.parseSongString).reverse();
    }
    async setEmbed(id) {
        await this.store.redis.set(this.keys.embed, id);
    }
    async getEmbed() {
        return this.store.redis.get(this.keys.embed);
    }
    async deleteEmbed() {
        await this.store.redis.del(this.keys.embed);
    }
    stringifySong(song) {
        return JSON.stringify(song);
    }
    parseSongString(song) {
        return JSON.parse(song);
    }
}
exports.Queue = Queue;
//# sourceMappingURL=Queue.js.map