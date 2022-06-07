import { load } from '@lavaclient/spotify';
import {
  ApplicationCommandRegistries,
  RegisterBehavior
} from '@sapphire/framework';
import type { NewsChannel, TextChannel, ThreadChannel } from 'discord.js';
import { Player } from 'lavaclient';
import { Queue } from './lib/utils/queue/Queue';
import type { Song } from './lib/utils/queue/Song';
import { ExtendedClient } from './structures/ExtendedClient';
require('dotenv').config();

load({
  client: {
    id: process.env.SPOTIFY_CLIENT_ID!,
    secret: process.env.SPOTIFY_CLIENT_SECRET!
  },
  autoResolveYoutubeTracks: true
});

const client = new ExtendedClient();

client.on('ready', async () => {
  client.music.connect(client.user!.id);
  client.user ?.setActivity('/', {
    type: 'WATCHING'
  });
  client.user ?.setStatus('online');
});


export type MessageChannel = TextChannel | ThreadChannel | NewsChannel | null;

declare module 'lavaclient' {
  interface Player {
    readonly queue: Queue;
    [_queue]: Queue;
    nightcore: boolean;
    vaporwave: boolean;
    karaoke: boolean;
    bassboost: boolean;
  }

  interface ClusterEvents {
    nodeQueueCreate: (node: ClusterNode, queue: Queue) => void;
    nodeQueueFinish: (node: ClusterNode, queue: Queue) => void;
    nodeTrackStart: (node: ClusterNode, queue: Queue, song: Song) => void;
    nodeTrackEnd: (node: ClusterNode, queue: Queue, song: Song) => void;
  }

  interface NodeEvents {
    queueCreate: (queue: Queue) => void;
    queueFinish: (queue: Queue) => void;
    trackStart: (queue: Queue, song: Song) => void;
    trackEnd: (queue: Queue, song: Song) => void;
  }
}

const _queue: unique symbol = Symbol.for('Player#queue');
Reflect.defineProperty(Player.prototype, 'queue', {
  get(this: Player) {
    return (this[_queue] ??= new Queue(this));
  }
});

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
  RegisterBehavior.Overwrite
);

client.login(process.env.DISCORD_TOKEN);
