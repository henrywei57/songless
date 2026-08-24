import { readJSON, writeJSON, removeKey } from "./storage";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";
const SCOPES = "playlist-read-private playlist-read-collaborative";

interface TokenBundle {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  imageUrl?: string;
  trackCount: number;
}

export interface SpotifyPlaylistTrack {
  name: string;
  artist: string;
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
}

function randomString(len: number): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62]).join("");
}

export function getClientId(): string {
  return readJSON<string>("spotify-client-id", "");
}

export function setClientId(id: string): void {
  writeJSON("spotify-client-id", id.trim());
}

/**
 * Always the origin + the app's configured base path (e.g. https://host/songless/),
 * regardless of the exact URL the page was loaded with (trailing slash, query
 * string, etc.) — Spotify requires this to match the registered Redirect URI
 * byte-for-byte, so it must not depend on window.location.pathname.
 */
export function getRedirectUri(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}

export async function beginLogin(): Promise<void> {
  const clientId = getClientId();
  if (!clientId) throw new Error("Missing Spotify Client ID");
  const verifier = randomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));
  writeJSON("spotify-pkce-verifier", verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  window.location.assign(`${AUTHORIZE_URL}?${params.toString()}`);
}

/** Call once on app load; if the URL has an auth `code`, exchanges it for a token and cleans the URL. */
export async function completeLoginIfRedirected(): Promise<boolean> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) {
    url.searchParams.delete("error");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url.toString());
    return false;
  }
  if (!code) return false;

  const verifier = readJSON<string>("spotify-pkce-verifier", "");
  const clientId = getClientId();
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.toString());

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return false;
  const data = await res.json();
  const bundle: TokenBundle = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 30_000,
  };
  writeJSON("spotify-token", bundle);
  return true;
}

async function refreshToken(bundle: TokenBundle): Promise<TokenBundle | null> {
  if (!bundle.refreshToken) return null;
  const clientId = getClientId();
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: bundle.refreshToken,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const data = await res.json();
  const next: TokenBundle = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? bundle.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000 - 30_000,
  };
  writeJSON("spotify-token", next);
  return next;
}

async function getValidToken(): Promise<string | null> {
  let bundle = readJSON<TokenBundle | null>("spotify-token", null);
  if (!bundle) return null;
  if (Date.now() >= bundle.expiresAt) {
    bundle = await refreshToken(bundle);
    if (!bundle) return null;
  }
  return bundle.accessToken;
}

export function isLoggedIn(): boolean {
  return readJSON<TokenBundle | null>("spotify-token", null) !== null;
}

export function logout(): void {
  removeKey("spotify-token");
  removeKey("spotify-pkce-verifier");
}

async function spotifyFetch(path: string): Promise<any> {
  const token = await getValidToken();
  if (!token) throw new Error("Not logged in to Spotify");
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

export async function fetchMyPlaylists(): Promise<SpotifyPlaylistSummary[]> {
  const out: SpotifyPlaylistSummary[] = [];
  let path = "/me/playlists?limit=50";
  while (path) {
    const data = await spotifyFetch(path);
    for (const p of data.items) {
      out.push({
        id: p.id,
        name: p.name,
        imageUrl: p.images?.[0]?.url,
        trackCount: p.tracks?.total ?? 0,
      });
    }
    path = data.next ? data.next.replace(API_BASE, "") : "";
  }
  return out;
}

export async function fetchPlaylistTracks(playlistId: string): Promise<SpotifyPlaylistTrack[]> {
  const out: SpotifyPlaylistTrack[] = [];
  let path = `/playlists/${playlistId}/tracks?fields=next,items(track(name,artists(name),is_local))&limit=100`;
  while (path) {
    const data = await spotifyFetch(path);
    for (const item of data.items) {
      const t = item.track;
      if (!t || t.is_local || !t.name) continue;
      out.push({ name: t.name, artist: t.artists?.[0]?.name ?? "" });
    }
    path = data.next ? data.next.replace(API_BASE, "") : "";
  }
  return out;
}
