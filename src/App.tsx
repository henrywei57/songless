import { useEffect, useState } from "react";
import type { GameSource, Track } from "./lib/types";
import type { SongRef } from "./lib/songData";
import { GENRES } from "./lib/songData";
import { resolveArtistSource, resolveDailySource, resolveGenreSource, resolvePlaylistSource } from "./lib/resolveSource";
import { completeLoginIfRedirected } from "./lib/spotify";
import { useGame } from "./hooks/useGame";
import type { Candidate } from "./components/GuessInput";
import Home from "./components/Home";
import GenrePicker from "./components/GenrePicker";
import ArtistPicker from "./components/ArtistPicker";
import PlaylistConnect from "./components/PlaylistConnect";
import Round from "./components/Round";
import ResultsShare from "./components/ResultsShare";
import Modal from "./components/Modal";
import HowToPlay from "./components/HowToPlay";
import StatsPanel from "./components/StatsPanel";

type Screen =
  | { name: "home" }
  | { name: "genre" }
  | { name: "artist" }
  | { name: "playlist" }
  | { name: "loading"; label: string }
  | { name: "game"; source: GameSource; tracks: Track[]; candidates: Candidate[] }
  | { name: "error"; message: string };

const DAILY_SOURCE: GameSource = { kind: "daily", key: "daily-default", label: "Daily Songless" };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [showHowTo, setShowHowTo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeSource, setActiveSource] = useState<GameSource>(DAILY_SOURCE);

  useEffect(() => {
    completeLoginIfRedirected().then((didLogin) => {
      if (didLogin) setScreen({ name: "playlist" });
    });
  }, []);

  const game = useGame(
    screen.name === "game" ? screen.source : null,
    screen.name === "game" ? screen.tracks : null,
  );

  function goHome() {
    setScreen({ name: "home" });
  }

  async function playDaily() {
    setActiveSource(DAILY_SOURCE);
    setScreen({ name: "loading", label: "Loading today's songs…" });
    try {
      const tracks = await resolveDailySource();
      if (tracks.length < 3) throw new Error("Couldn't find enough songs today. Try again in a moment.");
      const candidates = tracks.map((t) => ({ title: t.title, artist: t.artist }));
      setScreen({ name: "game", source: DAILY_SOURCE, tracks, candidates });
    } catch (e) {
      setScreen({ name: "error", message: (e as Error).message });
    }
  }

  async function playGenre(slug: string) {
    const genre = GENRES.find((g) => g.slug === slug)!;
    const source: GameSource = { kind: "genre", key: slug, label: genre.label };
    setActiveSource(source);
    setScreen({ name: "loading", label: `Loading ${genre.label}…` });
    try {
      const tracks = await resolveGenreSource(slug);
      if (tracks.length < 3) throw new Error("Couldn't find enough songs in this genre right now.");
      const candidates: Candidate[] = genre.songs;
      setScreen({ name: "game", source, tracks, candidates });
    } catch (e) {
      setScreen({ name: "error", message: (e as Error).message });
    }
  }

  async function playArtist(artist: string) {
    const source: GameSource = { kind: "artist", key: artist.toLowerCase(), label: `Artist: ${artist}` };
    setActiveSource(source);
    setScreen({ name: "loading", label: `Loading ${artist}…` });
    try {
      const { tracks, catalog } = await resolveArtistSource(artist);
      if (tracks.length < 3) throw new Error(`Couldn't find enough songs for "${artist}".`);
      const candidates: Candidate[] = catalog.map((t) => ({ title: t.title, artist: t.artist }));
      setScreen({ name: "game", source, tracks, candidates });
    } catch (e) {
      setScreen({ name: "error", message: (e as Error).message });
    }
  }

  async function playPlaylist(playlistId: string, label: string, songRefs: SongRef[]) {
    const source: GameSource = { kind: "playlist", key: playlistId, label: `Playlist: ${label}` };
    setActiveSource(source);
    setScreen({ name: "loading", label: `Loading ${label}…` });
    try {
      const tracks = await resolvePlaylistSource(playlistId, songRefs);
      if (tracks.length < 3) throw new Error("Couldn't find playable previews for enough tracks in this playlist.");
      setScreen({ name: "game", source, tracks, candidates: songRefs });
    } catch (e) {
      setScreen({ name: "error", message: (e as Error).message });
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <button onClick={goHome} className="text-lg font-bold text-text">
          🎵 Songless
        </button>
        <div className="flex gap-3">
          <button onClick={() => setShowStats(true)} className="text-sm text-text-dim hover:text-text">
            Stats
          </button>
          <button onClick={() => setShowHowTo(true)} className="text-sm text-text-dim hover:text-text">
            How to Play
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        {screen.name === "home" && (
          <Home
            onSelectDaily={playDaily}
            onSelectGenre={() => setScreen({ name: "genre" })}
            onSelectArtist={() => setScreen({ name: "artist" })}
            onSelectPlaylist={() => setScreen({ name: "playlist" })}
          />
        )}

        {screen.name === "genre" && <GenrePicker onPick={playGenre} onBack={goHome} />}
        {screen.name === "artist" && <ArtistPicker onPick={playArtist} onBack={goHome} />}
        {screen.name === "playlist" && <PlaylistConnect onPick={playPlaylist} onBack={goHome} />}

        {screen.name === "loading" && (
          <div className="flex flex-col items-center gap-3 text-text-dim">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span>{screen.label}</span>
          </div>
        )}

        {screen.name === "error" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-bad">{screen.message}</span>
            <button onClick={goHome} className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:border-accent">
              Back Home
            </button>
          </div>
        )}

        {screen.name === "game" && game.state && !game.state.finished && game.currentRound && (
          <Round
            round={game.currentRound}
            roundIndex={game.state.currentRound}
            totalRounds={game.state.rounds.length}
            candidates={screen.candidates}
            onGuess={game.submitGuess}
            onSkip={game.skip}
            onNext={game.nextRound}
          />
        )}

        {screen.name === "game" && game.state && game.state.finished && (
          <ResultsShare state={game.state} onBackHome={goHome} />
        )}
      </main>

      {showHowTo && (
        <Modal title="How to Play" onClose={() => setShowHowTo(false)}>
          <HowToPlay />
        </Modal>
      )}
      {showStats && (
        <Modal title="Stats" onClose={() => setShowStats(false)}>
          <StatsPanel sourceKey={`${activeSource.kind}:${activeSource.key}`} label={activeSource.label} />
        </Modal>
      )}
    </div>
  );
}
