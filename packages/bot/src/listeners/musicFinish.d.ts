import { Listener } from '@sapphire/framework';
import type { Queue } from '../lib/utils/queue/Queue';
export declare class MusicFinishListener extends Listener {
    run(queue: Queue, skipped?: boolean): Promise<void>;
}
