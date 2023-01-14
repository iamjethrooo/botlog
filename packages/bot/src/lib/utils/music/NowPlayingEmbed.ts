import { ColorResolvable, MessageEmbed } from 'discord.js';
import progressbar from 'string-progressbar';
import type { Song } from '../queue/Song';

type PositionType = number | undefined;

export class NowPlayingEmbed {
  track: Song;
  position: PositionType;
  length: number;
  volume: number;
  queue?: Song[];
  last?: Song;
  paused?: Boolean;

  public constructor(
    track: Song,
    position: PositionType,
    length: number,
    volume: number,
    queue?: Song[],
    last?: Song,
    paused?: Boolean
  ) {
    this.track = track;
    this.position = position;
    this.length = length;
    this.volume = volume;
    this.queue = queue;
    this.last = last;
    this.paused = paused;
  }

  public async NowPlayingEmbed(): Promise<MessageEmbed> {
    let trackLength = this.timeString(
      this.millisecondsToTimeObject(this.length)
    );

    const durationText = this.track.isSeekable
      ? `:stopwatch: ${trackLength}`
      : `:red_circle: Live Stream`;
    const userAvatar = this.track.requester?.avatar
      ? `https://cdn.discordapp.com/avatars/${this.track.requester?.id}/${this.track.requester?.avatar}.png`
      : this.track.requester?.defaultAvatarURL ??
        'https://cdn.discordapp.com/embed/avatars/1.png'; // default Discord Avatar

    let embedColor: ColorResolvable;
    let sourceTxt: string;
    let sourceIcon: string;

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
    let volumeIcon: string = ':speaker: ';
    if (vol > 50) volumeIcon = ':loud_sound: ';
    if (vol <= 50 && vol > 20) volumeIcon = ':sound: ';
    const embedFieldData = [
      {
        name: 'Volume',
        value: `${volumeIcon} ${this.volume}%`,
        inline: true
      },
      { name: 'Duration', value: durationText, inline: true }
    ];

    if (this.queue?.length) {
      embedFieldData.push(
        {
          name: 'Queue',
          value: `:notes: ${this.queue.length} ${
            this.queue.length == 1 ? 'Song' : 'Songs'
          }`,
          inline: true
        },
        {
          name: 'Next',
          value: `[${this.queue[0].title}](${this.queue[0].uri})`,
          inline: false
        }
      );
    }
    const baseEmbed = new MessageEmbed()
      .setTitle(
        `${this.paused ? ':pause_button: ' : ':arrow_forward: '} ${
          this.track.title
        }`
      )
      .setAuthor({
        name: sourceTxt,
        iconURL: sourceIcon
      })
      .setURL(this.track.uri)
      .setThumbnail(this.track.thumbnail)
      .setColor(embedColor)
      .addFields(embedFieldData)
      .setTimestamp(this.track.added ?? Date.now())
      .setFooter({
        text: `Requested By ${this.track.requester?.name}`,
        iconURL: userAvatar
      });

    // song just started embed
    if (this.position == undefined) this.position = 0;
    const bar = progressbar.splitBar(this.length, this.position, 22)[0];
    baseEmbed.setDescription(
      `${this.timeString(
        this.millisecondsToTimeObject(this.position)
      )} ${bar} ${trackLength}`
    );

    return baseEmbed;
  }

  private timeString(timeObject: any) {
    if (timeObject[1] === true) return timeObject[0];
    return `${timeObject.hours ? timeObject.hours + ':' : ''}${
      timeObject.minutes ? timeObject.minutes : '00'
    }:${
      timeObject.seconds < 10
        ? '0' + timeObject.seconds
        : timeObject.seconds
        ? timeObject.seconds
        : '00'
    }`;
  }

  private millisecondsToTimeObject(milliseconds: number) {
    return {
      seconds: Math.floor((milliseconds / 1000) % 60),
      minutes: Math.floor((milliseconds / (1000 * 60)) % 60),
      hours: Math.floor((milliseconds / (1000 * 60 * 60)) % 24)
    };
  }
}
