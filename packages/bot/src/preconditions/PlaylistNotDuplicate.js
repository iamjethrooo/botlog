"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistNotDuplicate = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const trpc_1 = require("../trpc");
let PlaylistNotDuplicate = class PlaylistNotDuplicate extends framework_1.Precondition {
    async chatInputRun(interaction) {
        const playlistName = interaction.options.getString('playlist-name', true);
        const guildMember = interaction.member;
        try {
            const playlist = await trpc_1.trpcNode.playlist.getPlaylist.query({
                name: playlistName,
                userId: guildMember.id
            });
            if (playlist)
                throw new Error();
        }
        catch {
            return this.error({
                message: `There is already a playlist named **${playlistName}** in your saved playlists!`
            });
        }
        return this.ok();
    }
};
PlaylistNotDuplicate = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'playlistNotDuplicate'
    })
], PlaylistNotDuplicate);
exports.PlaylistNotDuplicate = PlaylistNotDuplicate;
//# sourceMappingURL=PlaylistNotDuplicate.js.map