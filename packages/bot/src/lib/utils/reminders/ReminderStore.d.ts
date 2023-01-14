import Redis, { RedisKey, RedisValue } from 'ioredis';
export default class ReminderStore {
    redis: Redis;
    constructor();
    get(key: RedisKey): Promise<string | null>;
    getKeys(key: RedisKey): Promise<string[]>;
    getUsersReminders(keys: RedisKey[]): Promise<(string | null)[]>;
    delete(key: RedisKey): Promise<number>;
    setReminder(userId: string, event: string, value: RedisValue, expire: string): Promise<[error: Error | null, result: unknown][] | null>;
}
