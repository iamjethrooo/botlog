import { Listener } from '@sapphire/framework';
import type { Queue } from '../lib/utils/queue/Queue';
import type { Song } from '../lib/utils/queue/Song';
export declare class MusicSongPlayListener extends Listener {
    run(queue: Queue, track: Song): Promise<void>;
}
