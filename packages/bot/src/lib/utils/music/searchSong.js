"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const framework_1 = require("@sapphire/framework");
const spotify_1 = require("@lavaclient/spotify");
const Song_1 = require("../queue/Song");
async function searchSong(query, user) {
    const { client } = framework_1.container;
    let tracks = [];
    let response;
    let displayMessage = '';
    const { avatar, defaultAvatarURL, id, username } = user;
    if (client.music.spotify.isSpotifyUrl(query)) {
        const item = await client.music.spotify.load(query);
        switch (item === null || item === void 0 ? void 0 : item.type) {
            case spotify_1.SpotifyItemType.Track:
                const track = await item.resolveYoutubeTrack();
                tracks = [
                    new Song_1.Song(track, Date.now(), {
                        avatar,
                        defaultAvatarURL,
                        id,
                        name: username
                    })
                ];
                displayMessage = `Queued track [**${item.name}**](${query}).`;
                break;
            case spotify_1.SpotifyItemType.Artist:
                response = await item.resolveYoutubeTracks();
                response.forEach(track => tracks.push(new Song_1.Song(track, Date.now(), {
                    avatar,
                    defaultAvatarURL,
                    id,
                    name: username
                })));
                displayMessage = `Queued the **Top ${tracks.length} tracks** for [**${item.name}**](${query}).`;
                break;
            case spotify_1.SpotifyItemType.Album:
            case spotify_1.SpotifyItemType.Playlist:
                response = await item.resolveYoutubeTracks();
                response.forEach(track => tracks.push(new Song_1.Song(track, Date.now(), {
                    avatar,
                    defaultAvatarURL,
                    id,
                    name: username
                })));
                displayMessage = `Queued **${tracks.length} tracks** from ${spotify_1.SpotifyItemType[item.type].toLowerCase()} [**${item.name}**](${query}).`;
                break;
            default:
                displayMessage = ":x: Couldn't find what you were looking for :(";
                return [displayMessage, tracks];
        }
        return [displayMessage, tracks];
    }
    else {
        const results = await client.music.rest.loadTracks(/^https?:\/\//.test(query) ? query : `ytsearch:${query}`);
        switch (results.loadType) {
            case 'LOAD_FAILED':
            case 'NO_MATCHES':
                displayMessage = ":x: Couldn't find what you were looking for :(";
                return [displayMessage, tracks];
            case 'PLAYLIST_LOADED':
                results.tracks.forEach((track) => tracks.push(new Song_1.Song(track, Date.now(), {
                    avatar,
                    defaultAvatarURL,
                    id,
                    name: username
                })));
                displayMessage = `Queued playlist [**${results.playlistInfo.name}**](${query}), it has a total of **${tracks.length}** tracks.`;
                break;
            case 'TRACK_LOADED':
            case 'SEARCH_RESULT':
                const [track] = results.tracks;
                tracks = [
                    new Song_1.Song(track, Date.now(), {
                        avatar,
                        defaultAvatarURL,
                        id,
                        name: username
                    })
                ];
                displayMessage = `Queued [**${track.info.title}**](${track.info.uri})`;
                break;
        }
        return [displayMessage, tracks];
    }
}
exports.default = searchSong;
//# sourceMappingURL=searchSong.js.map