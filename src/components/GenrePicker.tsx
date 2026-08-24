import { GENRES } from "../lib/songData";

interface Props {
  onPick: (slug: string) => void;
  onBack: () => void;
}

export default function GenrePicker({ onPick, onBack }: Props) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <button onClick={onBack} className="text-sm text-text-dim hover:text-text">
          ← Back
        </button>
        <h2 className="text-xl font-semibold text-text">Pick a Genre</h2>
        <span className="w-10" />
      </div>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {GENRES.map((g) => (
          <button
            key={g.slug}
            onClick={() => onPick(g.slug)}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-5 transition hover:border-accent hover:bg-surface-2"
          >
            <span className="text-2xl">{g.emoji}</span>
            <span className="text-sm font-medium text-text">{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
