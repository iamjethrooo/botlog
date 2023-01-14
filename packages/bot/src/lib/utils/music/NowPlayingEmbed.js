"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NowPlayingEmbed = void 0;
const discord_js_1 = require("discord.js");
const string_progressbar_1 = __importDefault(require("string-progressbar"));
class NowPlayingEmbed {
    constructor(track, position, length, volume, queue, last, paused) {
        this.track = track;
        this.position = position;
        this.length = length;
        this.volume = volume;
        this.queue = queue;
        this.last = last;
        this.paused = paused;
    }
    async NowPlayingEmbed() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let trackLength = this.timeString(this.millisecondsToTimeObject(this.length));
        const durationText = this.track.isSeekable
            ? `:stopwatch: ${trackLength}`
            : `:red_circle: Live Stream`;
        const userAvatar = ((_a = this.track.requester) === null || _a === void 0 ? void 0 : _a.avatar)
            ? `https://cdn.discordapp.com/avatars/${(_b = this.track.requester) === null || _b === void 0 ? void 0 : _b.id}/${(_c = this.track.requester) === null || _c === void 0 ? void 0 : _c.avatar}.png`
            : (_e = (_d = this.track.requester) === null || _d === void 0 ? void 0 : _d.defaultAvatarURL) !== null && _e !== void 0 ? _e : 'https://cdn.discordapp.com/embed/avatars/1.png'; // default Discord Avatar
        let embedColor;
        let sourceTxt;
        let sourceIcon;
        switch (this.track.sourceName) {
            case 'soundcloud': {
                sourceTxt = 'SoundCloud';
                sourceIcon =
                    'https://a-v2.sndcdn.com/assets/images/sc-icons/fluid-b4e7a64b8b.png';
                embedColor = '#F26F23';
                break;
            }
            case 'youtube': {
                sourceTxt = 'YouTube';
                sourceIcon =
                    'https://www.youtube.com/s/desktop/acce624e/img/favicon_32x32.png';
                embedColor = '#FF0000';
                break;
            }
            default: {
                sourceTxt = 'Somewhere';
                sourceIcon = 'https://cdn.discordapp.com/embed/avatars/1.png';
                embedColor = 'DARK_RED';
                break;
            }
        }
        const vol = this.volume;
        let volumeIcon = ':speaker: ';
        if (vol > 50)
            volumeIcon = ':loud_sound: ';
        if (vol <= 50 && vol > 20)
            volumeIcon = ':sound: ';
        const embedFieldData = [
            {
                name: 'Volume',
                value: `${volumeIcon} ${this.volume}%`,
                inline: true
            },
            { name: 'Duration', value: durationText, inline: true }
        ];
        if ((_f = this.queue) === null || _f === void 0 ? void 0 : _f.length) {
            embedFieldData.push({
                name: 'Queue',
                value: `:notes: ${this.queue.length} ${this.queue.length == 1 ? 'Song' : 'Songs'}`,
                inline: true
            }, {
                name: 'Next',
                value: `[${this.queue[0].title}](${this.queue[0].uri})`,
                inline: false
            });
        }
        const baseEmbed = new discord_js_1.MessageEmbed()
            .setTitle(`${this.paused ? ':pause_button: ' : ':arrow_forward: '} ${this.track.title}`)
            .setAuthor({
            name: sourceTxt,
            iconURL: sourceIcon
        })
            .setURL(this.track.uri)
            .setThumbnail(this.track.thumbnail)
            .setColor(embedColor)
            .addFields(embedFieldData)
            .setTimestamp((_g = this.track.added) !== null && _g !== void 0 ? _g : Date.now())
            .setFooter({
            text: `Requested By ${(_h = this.track.requester) === null || _h === void 0 ? void 0 : _h.name}`,
            iconURL: userAvatar
        });
        // song just started embed
        if (this.position == undefined)
            this.position = 0;
        const bar = string_progressbar_1.default.splitBar(this.length, this.position, 22)[0];
        baseEmbed.setDescription(`${this.timeString(this.millisecondsToTimeObject(this.position))} ${bar} ${trackLength}`);
        return baseEmbed;
    }
    timeString(timeObject) {
        if (timeObject[1] === true)
            return timeObject[0];
        return `${timeObject.hours ? timeObject.hours + ':' : ''}${timeObject.minutes ? timeObject.minutes : '00'}:${timeObject.seconds < 10
            ? '0' + timeObject.seconds
            : timeObject.seconds
                ? timeObject.seconds
                : '00'}`;
    }
    millisecondsToTimeObject(milliseconds) {
        return {
            seconds: Math.floor((milliseconds / 1000) % 60),
            minutes: Math.floor((milliseconds / (1000 * 60)) % 60),
            hours: Math.floor((milliseconds / (1000 * 60 * 60)) % 24)
        };
    }
}
exports.NowPlayingEmbed = NowPlayingEmbed;
//# sourceMappingURL=NowPlayingEmbed.js.map