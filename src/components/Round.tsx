import type { RoundState } from "../lib/types";
import { durationForAttempt, MAX_ATTEMPTS } from "../lib/gameConfig";
import SnippetPlayer from "./SnippetPlayer";
import AttemptsTimeline from "./AttemptsTimeline";
import GuessInput, { type Candidate } from "./GuessInput";

interface Props {
  round: RoundState;
  roundIndex: number;
  totalRounds: number;
  candidates: Candidate[];
  onGuess: (value: string) => void;
  onSkip: () => void;
  onNext: () => void;
}

export default function Round({ round, roundIndex, totalRounds, candidates, onGuess, onSkip, onNext }: Props) {
  const done = round.status !== "playing";
  const unlocked = durationForAttempt(round.attempts.length);
  const attemptsLeft = MAX_ATTEMPTS - round.attempts.length;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="text-sm font-medium tracking-wide text-text-dim">
        SONG {roundIndex + 1} OF {totalRounds}
      </div>

      <SnippetPlayer previewUrl={round.track.previewUrl} unlockedSeconds={unlocked} disabled={done} />

      <AttemptsTimeline attempts={round.attempts} activeIndex={round.attempts.length} />

      {!done ? (
        <GuessInput
          candidates={candidates}
          onGuess={onGuess}
          onSkip={onSkip}
          disabled={done}
          attemptsLeft={attemptsLeft}
        />
      ) : (
        <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-4">
            {round.track.artworkUrl && (
              <img src={round.track.artworkUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            )}
            <div className="text-left">
              <div className="font-semibold text-text">{round.track.title}</div>
              <div className="text-sm text-text-dim">{round.track.artist}</div>
            </div>
          </div>
          <div className={`text-sm font-medium ${round.status === "won" ? "text-good" : "text-bad"}`}>
            {round.status === "won"
              ? `Nice! Solved in ${round.attempts.length} ${round.attempts.length === 1 ? "try" : "tries"}.`
              : "Out of guesses."}
          </div>
          <button
            onClick={onNext}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {roundIndex + 1 < totalRounds ? "Next Song →" : "See Results →"}
          </button>
        </div>
      )}
    </div>
  );
}
