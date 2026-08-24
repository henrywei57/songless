import { SNIPPET_DURATIONS } from "../lib/gameConfig";

export default function HowToPlay() {
  return (
    <div className="flex flex-col gap-3 text-left text-sm text-text-dim">
      <p>Every day you get three tracks. Guess each one in as few tries as you can.</p>
      <ul className="list-inside list-disc space-y-1">
        <li>Hit play to hear a snippet — it starts at just {SNIPPET_DURATIONS[0]}s.</li>
        <li>Wrong guesses and skips unlock more audio, up to {SNIPPET_DURATIONS.at(-1)}s.</li>
        <li>You get {SNIPPET_DURATIONS.length} attempts per song.</li>
        <li>Type to search — pick a suggestion or press Enter to submit.</li>
        <li>Choose Daily for the same songs as everyone else, or a genre, artist, or your own Spotify playlist.</li>
      </ul>
      <p>Scores are saved privately in your browser only — no account needed.</p>
    </div>
  );
}
