import type { Track } from "./types";
import { readJSON, writeJSON } from "./storage";

const SEARCH_URL = "https://itunes.apple.com/search";
const LOOKUP_URL = "https://itunes.apple.com/lookup";

interface ItunesRawTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
  primaryGenreName?: string;
}

function toTrack(t: ItunesRawTrack): Track {
  return {
    id: `itunes-${t.trackId}`,
    title: t.trackName,
    artist: t.artistName,
    artworkUrl: t.artworkUrl100?.replace("100x100", "400x400"),
    previewUrl: t.previewUrl!,
  };
}

async function fetchJSON(url: string): Promise<{ results: ItunesRawTrack[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes request failed: ${res.status}`);
  return res.json();
}

export async function searchSongs(
  term: string,
  opts: { attribute?: "artistTerm" | "songTerm"; limit?: number } = {},
): Promise<Track[]> {
  const params = new URLSearchParams({
    term,
    media: "music",
    entity: "song",
    limit: String(opts.limit ?? 50),
  });
  if (opts.attribute) params.set("attribute", opts.attribute);
  const data = await fetchJSON(`${SEARCH_URL}?${params.toString()}`);
  return data.results.filter((r) => r.previewUrl).map(toTrack);
}

/** Resolves a curated "Title by Artist" pair to a playable iTunes track, with persistent caching. */
export async function resolveTrack(title: string, artist: string): Promise<Track | null> {
  const cacheKey = `itunes-resolve:${title.toLowerCase()}|${artist.toLowerCase()}`;
  const cached = readJSON<Track | null>(cacheKey, undefined as unknown as Track | null);
  if (cached !== undefined) return cached;

  try {
    const results = await searchSongs(`${title} ${artist}`, { limit: 10 });
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const wantTitle = norm(title);
    const wantArtist = norm(artist);
    let best =
      results.find((r) => norm(r.title) === wantTitle && norm(r.artist).includes(wantArtist.split(" ")[0])) ??
      results.find((r) => norm(r.artist).includes(wantArtist.split(" ")[0])) ??
      results[0] ??
      null;
    writeJSON(cacheKey, best);
    return best;
  } catch {
    return null;
  }
}

export async function searchArtistCatalog(artist: string): Promise<Track[]> {
  const results = await searchSongs(artist, { attribute: "artistTerm", limit: 200 });
  const wanted = artist.toLowerCase().trim();
  const filtered = results.filter((r) => r.artist.toLowerCase().includes(wanted) || wanted.includes(r.artist.toLowerCase()));
  const pool = filtered.length >= 5 ? filtered : results;
  const seen = new Set<string>();
  const deduped: Track[] = [];
  for (const t of pool) {
    const key = t.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(t);
  }
  return deduped;
}

export async function searchArtists(term: string): Promise<string[]> {
  if (!term.trim()) return [];
  const params = new URLSearchParams({ term, entity: "musicArtist", limit: "8" });
  const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  const names = (data.results as { artistName: string }[]).map((r) => r.artistName);
  return Array.from(new Set(names));
}

export async function lookupById(itunesTrackId: number): Promise<Track | null> {
  const data = await fetchJSON(`${LOOKUP_URL}?id=${itunesTrackId}`);
  const r = data.results[0];
  if (!r || !r.previewUrl) return null;
  return toTrack(r);
}
