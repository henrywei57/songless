import { readJSON, statsKey, emptyStats } from "../lib/storage";

interface Props {
  onSelectDaily: () => void;
  onSelectGenre: () => void;
  onSelectArtist: () => void;
  onSelectPlaylist: () => void;
}

interface ModeCardProps {
  emoji: string;
  title: string;
  desc: string;
  onClick: () => void;
}

function ModeCard({ emoji, title, desc, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-accent hover:bg-surface-2"
    >
      <span className="text-3xl">{emoji}</span>
      <span className="font-semibold text-text">{title}</span>
      <span className="text-sm text-text-dim">{desc}</span>
      <span className="mt-1 text-sm font-medium text-accent opacity-0 transition group-hover:opacity-100">Play →</span>
    </button>
  );
}

export default function Home({ onSelectDaily, onSelectGenre, onSelectArtist, onSelectPlaylist }: Props) {
  const dailyStats = readJSON(statsKey("daily:daily-default"), emptyStats());

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-10 px-4 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-3xl">
          🎵
        </div>
        <h1 className="text-4xl font-bold text-text">Songless</h1>
        <p className="max-w-md text-text-dim">
          Hear a tiny snippet of a song — as little as two tenths of a second. Every wrong guess or skip unlocks
          more audio, up to 15 seconds. Name the track in as few tries as you can.
        </p>
        {dailyStats.played > 0 && (
          <div className="mt-1 flex gap-4 text-sm text-text-dim">
            <span>🔥 {dailyStats.currentStreak} day streak</span>
            <span>·</span>
            <span>{dailyStats.played} played</span>
          </div>
        )}
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <ModeCard
          emoji="📅"
          title="Daily Songless"
          desc="Three songs, same for everyone today. Compare scores with friends."
          onClick={onSelectDaily}
        />
        <ModeCard
          emoji="🎸"
          title="Pick a Genre"
          desc="Pop, hip-hop, rock, K-pop, and more — a daily mix from that genre."
          onClick={onSelectGenre}
        />
        <ModeCard
          emoji="🔎"
          title="Pick an Artist"
          desc="Search any artist and get quizzed on their catalog."
          onClick={onSelectArtist}
        />
        <ModeCard
          emoji="🟢"
          title="Your Spotify Playlist"
          desc="Connect Spotify and play a daily mix pulled from your own playlist."
          onClick={onSelectPlaylist}
        />
      </div>
    </div>
  );
}
