"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.songRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.songRouter = trpc_1.t.router({
    createMany: trpc_1.t.procedure
        .input(zod_1.z.object({
        songs: zod_1.z.array(zod_1.z.any())
    }))
        .mutation(async ({ ctx, input }) => {
        const { songs } = input;
        const songsCreated = await ctx.prisma.song.createMany({
            data: songs
        });
        return { songsCreated };
    }),
    delete: trpc_1.t.procedure
        .input(zod_1.z.object({
        id: zod_1.z.number()
    }))
        .mutation(async ({ ctx, input }) => {
        const { id } = input;
        const song = await ctx.prisma.song.delete({
            where: {
                id: id
            }
        });
        return { song };
    })
});
//# sourceMappingURL=song.js.map