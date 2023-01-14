"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playlistRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.playlistRouter = trpc_1.t.router({
    getPlaylist: trpc_1.t.procedure
        .input(zod_1.z.object({
        userId: zod_1.z.string(),
        name: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { userId, name } = input;
        const playlist = await ctx.prisma.playlist.findFirst({
            where: {
                userId,
                name
            },
            include: {
                songs: true
            }
        });
        return { playlist };
    }),
    getAll: trpc_1.t.procedure
        .input(zod_1.z.object({
        userId: zod_1.z.string()
    }))
        .query(async ({ ctx, input }) => {
        const { userId } = input;
        const playlists = await ctx.prisma.playlist.findMany({
            where: {
                userId
            },
            include: {
                songs: true
            },
            orderBy: {
                id: 'asc'
            }
        });
        return { playlists };
    }),
    create: trpc_1.t.procedure
        .input(zod_1.z.object({
        userId: zod_1.z.string(),
        name: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { userId, name } = input;
        const playlist = await ctx.prisma.playlist.create({
            data: {
                name,
                user: {
                    connect: {
                        id: userId
                    }
                }
            }
        });
        return { playlist };
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({
        userId: zod_1.z.string(),
        name: zod_1.z.string()
    }))
        .mutation(async ({ ctx, input }) => {
        const { userId, name } = input;
        const playlist = await ctx.prisma.playlist.deleteMany({
            where: {
                userId,
                name
            }
        });
        return { playlist };
    })
});
//# sourceMappingURL=playlist.js.map