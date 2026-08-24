import { useState } from "react";
import type { GameState } from "../lib/types";
import { dayNumber } from "../lib/rng";

interface Props {
  state: GameState;
  onBackHome: () => void;
}

function roundEmoji(round: GameState["rounds"][number]): string {
  return round.attempts
    .map((a) => (a.kind === "skip" ? "🟨" : a.correct ? "🟩" : "⬛"))
    .join("");
}

export default function ResultsShare({ state, onBackHome }: Props) {
  const [copied, setCopied] = useState(false);
  const solved = state.rounds.filter((r) => r.status === "won").length;

  const shareText = [
    `Songless #${dayNumber()} — ${state.source.label}`,
    ...state.rounds.map((r) => `🎧 ${roundEmoji(r)}`),
    `${solved}/${state.rounds.length} solved`,
    typeof window !== "undefined" ? window.location.origin : "",
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <h2 className="text-2xl font-semibold text-text">Results</h2>
      <div className="text-text-dim">
        {solved} / {state.rounds.length} solved · {state.source.label}
      </div>

      <div className="flex w-full flex-col gap-3">
        {state.rounds.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center gap-3 text-left">
              {r.track.artworkUrl && <img src={r.track.artworkUrl} alt="" className="h-10 w-10 rounded object-cover" />}
              <div>
                <div className="text-sm font-medium text-text">{r.track.title}</div>
                <div className="text-xs text-text-dim">{r.track.artist}</div>
              </div>
            </div>
            <div className="font-mono text-lg tracking-widest">{roundEmoji(r)}</div>
          </div>
        ))}
      </div>

      <pre className="scrollbar-thin w-full overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2 p-4 text-left font-mono text-sm text-text">
        {shareText}
      </pre>

      <div className="flex w-full gap-3">
        <button
          onClick={copy}
          className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          {copied ? "Copied!" : "Copy Results"}
        </button>
        <button
          onClick={onBackHome}
          className="flex-1 rounded-lg border border-border px-4 py-3 text-sm text-text-dim transition hover:text-text"
        >
          Back Home
        </button>
      </div>
      <div className="text-xs text-text-dim">Come back tomorrow for a new set.</div>
    </div>
  );
}
