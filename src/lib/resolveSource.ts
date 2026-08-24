import type { GameSource, Track } from "./types";
import type { SongRef } from "./songData";
import { DAILY_POOL, GENRES } from "./songData";
import { resolveTrack, searchArtistCatalog } from "./itunes";
import { seededShuffle, seededPick, todayKey } from "./rng";

const NEEDED = 3;

/** Shuffles a SongRef pool deterministically and resolves entries to playable tracks until `needed` are found. */
async function resolveSongRefPool(pool: SongRef[], seed: string, maxAttempts: number): Promise<Track[]> {
  const shuffled = seededShuffle(pool, seed);
  const found: Track[] = [];
  const seenTitles = new Set<string>();
  for (const ref of shuffled.slice(0, maxAttempts)) {
    if (found.length >= NEEDED) break;
    const track = await resolveTrack(ref.title, ref.artist);
    if (!track) continue;
    const key = track.title.toLowerCase();
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    found.push(track);
  }
  return found;
}

export async function resolveDailySource(): Promise<Track[]> {
  const seed = `daily-default:${todayKey()}`;
  return resolveSongRefPool(DAILY_POOL, seed, DAILY_POOL.length);
}

export async function resolveGenreSource(slug: string): Promise<Track[]> {
  const genre = GENRES.find((g) => g.slug === slug);
  if (!genre) return [];
  const seed = `genre:${slug}:${todayKey()}`;
  return resolveSongRefPool(genre.songs, seed, genre.songs.length);
}

export async function resolveArtistSource(artistName: string): Promise<{ tracks: Track[]; catalog: Track[] }> {
  const catalog = await searchArtistCatalog(artistName);
  const seed = `artist:${artistName.toLowerCase()}:${todayKey()}`;
  const tracks = seededPick(catalog, Math.min(NEEDED, catalog.length), seed);
  return { tracks, catalog };
}

export async function resolvePlaylistSource(
  playlistId: string,
  playlistTracks: SongRef[],
): Promise<Track[]> {
  const seed = `playlist:${playlistId}:${todayKey()}`;
  return resolveSongRefPool(playlistTracks, seed, Math.min(playlistTracks.length, 40));
}

export function sourceStorageKey(source: GameSource): string {
  return `${source.kind}:${source.key}`;
}
