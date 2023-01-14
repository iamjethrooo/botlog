"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const options = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: Number.parseInt(process.env.REDIS_DB) || 0
};
const pubSub = new ioredis_1.default(options);
class PubSub {
    publish(channel, message) {
        pubSub.publish(channel, message);
    }
    subscribe(channel) {
        pubSub.subscribe(channel);
    }
    on(event, callback) {
        pubSub.on(event, (channel, message) => {
            callback(channel, message);
        });
    }
}
const instance = new PubSub();
exports.default = instance;
//# sourceMappingURL=RemindersPubSub.js.map