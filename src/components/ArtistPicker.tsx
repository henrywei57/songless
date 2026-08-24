import { useEffect, useRef, useState } from "react";
import { searchArtists } from "../lib/itunes";

interface Props {
  onPick: (artist: string) => void;
  onBack: () => void;
}

export default function ArtistPicker({ onPick, onBack }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const names = await searchArtists(query);
        setSuggestions(names);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <button onClick={onBack} className="text-sm text-text-dim hover:text-text">
          ← Back
        </button>
        <h2 className="text-xl font-semibold text-text">Pick an Artist</h2>
        <span className="w-10" />
      </div>

      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) onPick(query.trim());
        }}
        placeholder="Search for an artist..."
        className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-text outline-none focus:border-accent"
      />

      {loading && <div className="text-sm text-text-dim">Searching…</div>}

      {suggestions.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          {suggestions.map((name) => (
            <button
              key={name}
              onClick={() => onPick(name)}
              className="rounded-lg border border-border bg-surface px-4 py-3 text-left text-text transition hover:border-accent hover:bg-surface-2"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {!loading && query.trim() && suggestions.length === 0 && (
        <button
          onClick={() => onPick(query.trim())}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Play with "{query.trim()}"
        </button>
      )}
    </div>
  );
}
