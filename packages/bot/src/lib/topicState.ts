import * as fs from 'fs';
import * as path from 'path';

export function topicFile(env = process.env) {
  const seed = path.resolve(__dirname, '../../src/resources/other/topics.txt');
  if (!env.BOT_DATA_DIR) return seed;
  const target = path.join(env.BOT_DATA_DIR, 'topics.txt');
  fs.mkdirSync(env.BOT_DATA_DIR, { recursive: true });
  try {
    // An empty file is exhausted state, and must never be reseeded on restart.
    fs.copyFileSync(seed, target, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  return target;
}
