"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const client_1 = require("@trpc/client");
const fetch = (0, client_1.getFetch)();
exports.channelRouter = trpc_1.t.router({
    getAll: trpc_1.t.procedure
        .input(zod_1.z.object({
        guildId: zod_1.z.string()
    }))
        .query(async ({ input }) => {
        const { guildId } = input;
        const token = process.env.DISCORD_TOKEN;
        // call the discord api with the token and the guildId and get all the guild's text channels
        const response = await fetch(`https://discordapp.com/api/guilds/${guildId}/channels`, {
            headers: {
                Authorization: `Bot ${token}`
            }
        });
        const responseChannels = await response.json();
        const channels = responseChannels.filter(channel => channel.type === 0);
        return { channels };
    })
});
//# sourceMappingURL=channel.js.map