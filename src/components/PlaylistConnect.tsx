import { useEffect, useState } from "react";
import RedirectUriBox from "./RedirectUriBox";
import {
  beginLogin,
  fetchMe,
  fetchMyPlaylists,
  fetchPlaylistTracks,
  getClientId,
  isLoggedIn,
  logout,
  setClientId,
  type SpotifyPlaylistSummary,
  type SpotifyProfile,
} from "../lib/spotify";
import type { SongRef } from "../lib/songData";

interface Props {
  onPick: (playlistId: string, label: string, tracks: SongRef[]) => void;
  onBack: () => void;
}

export default function PlaylistConnect({ onPick, onBack }: Props) {
  const [clientIdInput, setClientIdInput] = useState(getClientId());
  const [savedClientId, setSavedClientId] = useState(getClientId());
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [playlists, setPlaylists] = useState<SpotifyPlaylistSummary[] | null>(null);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loggedIn && savedClientId) {
      setLoading(true);
      setError(null);
      // Best-effort: shows which Spotify account this session is actually authorized as,
      // which is the key thing to check when playlists fail with a 403 below.
      fetchMe()
        .then(setProfile)
        .catch(() => {});
      fetchMyPlaylists()
        .then(setPlaylists)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [loggedIn, savedClientId]);

  function reconnect() {
    logout();
    setLoggedIn(false);
    setPlaylists(null);
    setProfile(null);
    setError(null);
  }

  function saveClientId() {
    setClientId(clientIdInput);
    setSavedClientId(clientIdInput.trim());
  }

  async function connect() {
    setError(null);
    try {
      await beginLogin();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function selectPlaylist(p: SpotifyPlaylistSummary) {
    setResolving(p.id);
    setError(null);
    try {
      const tracks = await fetchPlaylistTracks(p.id);
      const songRefs: SongRef[] = tracks.map((t) => ({ title: t.name, artist: t.artist }));
      if (songRefs.length < 3) {
        setError("This playlist needs at least 3 tracks.");
        setResolving(null);
        return;
      }
      onPick(p.id, p.name, songRefs);
    } catch (e) {
      setError((e as Error).message);
      setResolving(null);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <button onClick={onBack} className="text-sm text-text-dim hover:text-text">
          ← Back
        </button>
        <h2 className="text-xl font-semibold text-text">Your Spotify Playlist</h2>
        <span className="w-10" />
      </div>

      {!savedClientId && (
        <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-left text-sm">
          <p className="text-text-dim">
            To play from your own playlists, create a free app at{" "}
            <span className="text-text">developer.spotify.com/dashboard</span> and paste its{" "}
            <strong className="text-text">Client ID</strong> below. Add this exact Redirect URI to the app's
            settings (use the copy button — it must match byte-for-byte, including the trailing slash):
          </p>
          <RedirectUriBox />
          <input
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="Spotify Client ID"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
          />
          <button
            onClick={saveClientId}
            disabled={!clientIdInput.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            Save
          </button>
          <p className="text-text-dim">
            Your keys stay on this device only — nothing is sent anywhere but Spotify and Apple's public song
            search.
          </p>
        </div>
      )}

      {savedClientId && !loggedIn && (
        <div className="flex w-full flex-col items-center gap-4">
          <button
            onClick={connect}
            className="flex items-center gap-2 rounded-lg bg-[#1DB954] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Connect Spotify
          </button>

          <div className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-left text-sm">
            <p className="text-text-dim">
              Getting "redirect_uri: Not matching configuration"? Your Spotify app's Redirect URIs must contain
              this exact value, including the trailing slash — re-copy and re-paste it in{" "}
              <span className="text-text">developer.spotify.com/dashboard</span> → your app → Settings:
            </p>
            <RedirectUriBox />
          </div>

          <button onClick={() => setSavedClientId("")} className="text-xs text-text-dim hover:text-text">
            Use a different Client ID
          </button>
        </div>
      )}

      {savedClientId && loggedIn && (
        <div className="flex w-full flex-col gap-3">
          {profile && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-text-dim">
              <span>
                Connected as <span className="text-text">{profile.displayName}</span>
                {profile.email ? ` (${profile.email})` : ""}
              </span>
              <button onClick={reconnect} className="text-accent hover:underline">
                Not you?
              </button>
            </div>
          )}
          {loading && <div className="text-sm text-text-dim">Loading your playlists…</div>}
          {playlists && playlists.length === 0 && (
            <div className="text-sm text-text-dim">No playlists found on your account.</div>
          )}
          {playlists?.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPlaylist(p)}
              disabled={resolving !== null}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition hover:border-accent hover:bg-surface-2 disabled:opacity-50"
            >
              {p.imageUrl && <img src={p.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />}
              <div className="flex-1">
                <div className="text-sm font-medium text-text">{p.name}</div>
                <div className="text-xs text-text-dim">{p.trackCount} tracks</div>
              </div>
              {resolving === p.id && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              )}
            </button>
          ))}
          <button onClick={reconnect} className="mt-2 text-xs text-text-dim hover:text-text">
            Log out of Spotify
          </button>
        </div>
      )}

      {error && (
        <div className="flex w-full flex-col gap-3 rounded-xl border border-bad/40 bg-bad/10 p-4 text-left text-sm text-bad">
          <span>{error}</span>
          <button
            onClick={reconnect}
            className="self-start rounded-lg border border-bad/50 px-3 py-1.5 text-xs text-bad transition hover:bg-bad/10"
          >
            Log out & reconnect
          </button>
        </div>
      )}
    </div>
  );
}
