"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Song = void 0;
const encoding_1 = require("@lavalink/encoding");
const MetadataFilter = __importStar(require("metadata-filter"));
class Song {
    constructor(track, added, requester) {
        this.track = typeof track === 'string' ? track : track.track;
        this.requester = requester;
        this.added = added !== null && added !== void 0 ? added : Date.now();
        const filterSet = {
            song: [
                MetadataFilter.removeVersion,
                MetadataFilter.removeRemastered,
                MetadataFilter.fixTrackSuffix,
                MetadataFilter.removeLive,
                MetadataFilter.youtube,
                MetadataFilter.normalizeFeature,
                MetadataFilter.removeVersion
            ]
        };
        const filter = MetadataFilter.createFilter(filterSet);
        // TODO: make this less shitty
        if (typeof track !== 'string') {
            this.length = track.info.length;
            this.identifier = track.info.identifier;
            this.author = track.info.author;
            this.isStream = track.info.isStream;
            this.position = track.info.position;
            this.title = filter.filterField('song', track.info.title);
            this.uri = track.info.uri;
            this.isSeekable = track.info.isSeekable;
            this.sourceName = track.info.sourceName;
        }
        else {
            const decoded = (0, encoding_1.decode)(this.track);
            this.length = Number(decoded.length);
            this.identifier = decoded.identifier;
            this.author = decoded.author;
            this.isStream = decoded.isStream;
            this.position = Number(decoded.position);
            this.title = filter.filterField('song', decoded.title);
            this.uri = decoded.uri;
            this.isSeekable = !decoded.isStream;
            this.sourceName = decoded.source;
        }
        // Thumbnails
        switch (this.sourceName) {
            case 'soundcloud': {
                this.thumbnail =
                    'https://a-v2.sndcdn.com/assets/images/sc-icons/fluid-b4e7a64b8b.png'; // SoundCloud Logo
                break;
            }
            case 'youtube': {
                this.thumbnail = `https://img.youtube.com/vi/${this.identifier}/hqdefault.jpg`; // Track Thumbnail
                break;
            }
            case 'twitch': {
                this.thumbnail = 'https://i.imgur.com/nO3f4jq.png'; // large Twitch Logo
                break;
            }
            default: {
                this.thumbnail = 'https://cdn.discordapp.com/embed/avatars/1.png'; // Discord Default Avatar
                break;
            }
        }
    }
}
exports.Song = Song;
//# sourceMappingURL=Song.js.map