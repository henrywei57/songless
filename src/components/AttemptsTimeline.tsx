import { SNIPPET_DURATIONS } from "../lib/gameConfig";
import type { Attempt } from "../lib/types";

interface Props {
  attempts: Attempt[];
  activeIndex: number;
}

export default function AttemptsTimeline({ attempts, activeIndex }: Props) {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-1.5">
      {SNIPPET_DURATIONS.map((dur, i) => {
        const attempt = attempts[i];
        const isActive = i === activeIndex;
        let content: string;
        let classes = "border-border bg-surface-2 text-text-dim";
        if (attempt) {
          if (attempt.kind === "skip") {
            content = "–";
            classes = "border-warn/60 bg-warn/10 text-warn";
          } else if (attempt.correct) {
            content = "✓";
            classes = "border-good bg-good/15 text-good";
          } else {
            content = "✕";
            classes = "border-bad/60 bg-bad/10 text-bad";
          }
        } else {
          content = `${dur}s`;
        }
        return (
          <div
            key={i}
            className={`flex h-10 flex-1 items-center justify-center rounded-lg border text-xs font-medium transition ${classes} ${
              isActive ? "ring-2 ring-accent" : ""
            }`}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
