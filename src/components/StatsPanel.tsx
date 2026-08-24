import { readJSON, statsKey, emptyStats } from "../lib/storage";

interface Props {
  sourceKey: string;
  label: string;
}

export default function StatsPanel({ sourceKey, label }: Props) {
  const stats = readJSON(statsKey(sourceKey), emptyStats());
  const winPct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  const maxDist = Math.max(1, ...stats.distribution);

  return (
    <div className="flex flex-col gap-4 text-left text-sm">
      <div className="text-text-dim">{label}</div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Played" value={stats.played} />
        <Stat label="Win %" value={winPct} />
        <Stat label="Streak" value={stats.currentStreak} />
        <Stat label="Best" value={stats.maxStreak} />
      </div>
      <div>
        <div className="mb-2 text-text-dim">Guess distribution</div>
        <div className="flex flex-col gap-1">
          {stats.distribution.map((count, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 text-xs text-text-dim">{i === 6 ? "✕" : i + 1}</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-surface-2">
                <div
                  className={`h-full ${i === 6 ? "bg-bad" : "bg-accent"}`}
                  style={{ width: `${(count / maxDist) * 100}%`, minWidth: count ? "8%" : "0%" }}
                />
              </div>
              <span className="w-6 text-right text-xs text-text-dim">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 py-2">
      <div className="text-lg font-semibold text-text">{value}</div>
      <div className="text-xs text-text-dim">{label}</div>
    </div>
  );
}
