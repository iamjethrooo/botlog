"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedClient = void 0;
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const QueueClient_1 = require("../lib/utils/queue/QueueClient");
const ioredis_1 = __importDefault(require("ioredis"));
const buttonsCollector_1 = require("../lib/utils/music/buttonsCollector");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: path_1.default.resolve(__dirname, '../../../../.env')
});
class ExtendedClient extends framework_1.SapphireClient {
    constructor() {
        super({
            intents: [
                discord_js_1.Intents.FLAGS.GUILDS,
                discord_js_1.Intents.FLAGS.GUILD_MEMBERS,
                discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
                discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES
            ],
            logger: { level: 100 }
        });
        this.music = new QueueClient_1.QueueClient({
            sendGatewayPayload: (id, payload) => { var _a, _b; return (_b = (_a = this.guilds.cache.get(id)) === null || _a === void 0 ? void 0 : _a.shard) === null || _b === void 0 ? void 0 : _b.send(payload); },
            options: {
                redis: new ioredis_1.default({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: Number.parseInt(process.env.REDIS_PORT) || 6379,
                    password: process.env.REDIS_PASSWORD || '',
                    db: Number.parseInt(process.env.REDIS_DB) || 0
                })
            },
            connection: {
                host: process.env.LAVA_HOST || '',
                password: process.env.LAVA_PASS || '',
                port: process.env.LAVA_PORT ? +process.env.LAVA_PORT : 1339,
                secure: process.env.LAVA_SECURE === 'true' ? true : false
            }
        });
        this.ws.on('VOICE_SERVER_UPDATE', data => {
            this.music.handleVoiceUpdate(data);
        });
        this.ws.on('VOICE_STATE_UPDATE', async (data) => {
            var _a;
            // handle if a mod right-clicks disconnect on the bot
            if (!data.channel_id && data.user_id == ((_a = this.application) === null || _a === void 0 ? void 0 : _a.id)) {
                const queue = this.music.queues.get(data.guild_id);
                await (0, buttonsCollector_1.deletePlayerEmbed)(queue);
                await queue.clear();
                queue.destroyPlayer();
            }
            this.music.handleVoiceUpdate(data);
        });
        this.leaveTimers = {};
        this.snipes = new Map();
        this.editsnipes = new Map;
    }
}
exports.ExtendedClient = ExtendedClient;
//# sourceMappingURL=ExtendedClient.js.map