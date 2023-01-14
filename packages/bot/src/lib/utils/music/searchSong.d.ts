import { Song } from '../queue/Song';
import type { User } from 'discord.js';
export default function searchSong(query: string, user: User): Promise<[string, Song[]]>;
