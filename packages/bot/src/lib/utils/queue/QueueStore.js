"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueStore = void 0;
const collection_1 = __importDefault(require("@discordjs/collection"));
const fs_1 = require("fs");
const path_1 = require("path");
const logger_1 = __importDefault(require("../logger"));
const Queue_1 = require("./Queue");
const commands = [
    {
        name: 'lmove',
        keys: 1
    },
    {
        name: 'lremat',
        keys: 1
    },
    {
        name: 'lshuffle',
        keys: 1
    },
    {
        name: 'rpopset',
        keys: 2
    }
];
class QueueStore extends collection_1.default {
    constructor(client, redis) {
        super();
        this.client = client;
        this.redis = redis;
        // Redis Errors
        redis.on('error', err => logger_1.default.error('Redis ' + err));
        for (const command of commands) {
            this.redis.defineCommand(command.name, {
                numberOfKeys: command.keys,
                lua: (0, fs_1.readFileSync)((0, path_1.resolve)((0, path_1.join)(__dirname, '..', '..', '..'), 'audio', `${command.name}.lua`)).toString()
            });
        }
    }
    get(key) {
        let queue = super.get(key);
        if (!queue) {
            queue = new Queue_1.Queue(this, key);
            this.set(key, queue);
        }
        return queue;
    }
    async start() {
        const guilds = await this.getPlayingEntries();
        await Promise.all(guilds.map(guild => this.get(guild).start()));
    }
    async getPlayingEntries() {
        const guilds = new Set();
        let cursor = '0';
        do {
            // `scan` returns a tuple with the next cursor (which must be used for the
            // next iteration) and an array of the matching keys. The iterations end when
            // cursor becomes '0' again.
            const response = await this.redis.scan(cursor, 'MATCH', 'music.*.position');
            [cursor] = response;
            for (const key of response[1]) {
                // Slice 'skyra.a.' from the start, and '.p' from the end:
                const id = key.slice(8, -2);
                guilds.add(id);
            }
        } while (cursor !== '0');
        return [...guilds];
    }
}
exports.QueueStore = QueueStore;
//# sourceMappingURL=QueueStore.js.map