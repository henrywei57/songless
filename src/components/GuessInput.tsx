import { useMemo, useRef, useState } from "react";

export interface Candidate {
  title: string;
  artist: string;
}

interface Props {
  candidates: Candidate[];
  onGuess: (value: string) => void;
  onSkip: () => void;
  disabled: boolean;
  attemptsLeft: number;
}

export default function GuessInput({ candidates, onGuess, onSkip, disabled, attemptsLeft }: Props) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const matches: Candidate[] = [];
    for (const c of candidates) {
      const key = c.title.toLowerCase();
      if (seen.has(key)) continue;
      if (key.includes(q) || c.artist.toLowerCase().includes(q)) {
        seen.add(key);
        matches.push(c);
      }
      if (matches.length >= 7) break;
    }
    return matches;
  }, [value, candidates]);

  function commit(text: string) {
    if (!text.trim() || disabled) return;
    onGuess(text.trim());
    setValue("");
    setOpen(false);
    setHighlight(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions[highlight]) commit(suggestions[highlight].title);
      else commit(value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          disabled={disabled}
          placeholder={disabled ? "Round over" : "Guess the song title..."}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-text outline-none focus:border-accent disabled:opacity-50"
        />
        {open && suggestions.length > 0 && (
          <ul className="scrollbar-thin absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-xl">
            {suggestions.map((s, i) => (
              <li key={s.title + s.artist}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(s.title)}
                  className={`flex w-full flex-col items-start px-4 py-2 text-left text-sm hover:bg-surface-2 ${
                    i === highlight ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="text-text">{s.title}</span>
                  <span className="text-xs text-text-dim">{s.artist}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-text-dim">{attemptsLeft} guess{attemptsLeft === 1 ? "" : "es"} left</span>
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            disabled={disabled}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim transition hover:border-accent hover:text-text disabled:opacity-40"
          >
            Skip
          </button>
          <button
            onClick={() => commit(value)}
            disabled={disabled || !value.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            Guess
          </button>
        </div>
      </div>
    </div>
  );
}
