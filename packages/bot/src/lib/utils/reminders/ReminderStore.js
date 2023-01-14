"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
class ReminderStore {
    constructor() {
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number.parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || '',
            db: Number.parseInt(process.env.REDIS_DB) || 0
        });
        this.redis.on('ready', () => {
            this.redis.config('SET', 'notify-keyspace-events', 'Ex');
        });
    }
    get(key) {
        return this.redis.get(key);
    }
    getKeys(key) {
        return this.redis.keys(`reminders.${key}*`);
    }
    getUsersReminders(keys) {
        return this.redis.mget(keys);
    }
    delete(key) {
        return this.redis.del(key);
    }
    setReminder(userId, event, value, expire) {
        event = event.replace(/\./g, '');
        const delay = 60; // add extra time to data
        return (this.redis
            .multi()
            // Save a key for TTL (dummy data)
            .set(`reminders.${userId}.${event}.trigger`, 1)
            .expireat(`reminders.${userId}.${event}.trigger`, Date.parse(expire) / 1000)
            // Cache actual data
            .set(`reminders.${userId}.${event}`, value)
            .expireat(`reminders.${userId}.${event}`, Date.parse(expire) / 1000 + delay)
            .exec());
    }
}
exports.default = ReminderStore;
//# sourceMappingURL=ReminderStore.js.map