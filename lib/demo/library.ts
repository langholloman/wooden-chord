import { badSign } from "@/lib/demo/bad-sign";
import { thrill } from "@/lib/demo/thrill";
import type { Song } from "@/lib/demo/song";

export const SONGS: readonly Song[] = [thrill, badSign];

export function findSong(id: string): Song {
  return SONGS.find((song) => song.id === id) ?? SONGS[0];
}
