import { useEffect, useRef, useState } from "react";

interface Props {
  previewUrl: string;
  /** Seconds of audio currently unlocked to play, from the start of the preview clip. */
  unlockedSeconds: number;
  /** Bump this to force-stop playback (e.g. round ended). */
  disabled?: boolean;
}

export default function SnippetPlayer({ previewUrl, unlockedSeconds, disabled }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = new Audio(previewUrl);
    audio.preload = "auto";
    audioRef.current = audio;
    const onCanPlay = () => setReady(true);
    audio.addEventListener("canplaythrough", onCanPlay);
    return () => {
      audio.pause();
      audio.removeEventListener("canplaythrough", onCanPlay);
      audioRef.current = null;
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (disabled) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  function stop() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }

  function tick() {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(Math.min(audio.currentTime / unlockedSeconds, 1));
    if (!audio.paused) rafRef.current = requestAnimationFrame(tick);
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio || disabled) return;
    audio.currentTime = 0;
    setProgress(0);
    try {
      await audio.play();
    } catch {
      return;
    }
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
    stopTimer.current = window.setTimeout(() => {
      stop();
      setProgress(1);
    }, unlockedSeconds * 1000);
  }

  function toggle() {
    if (playing) stop();
    else play();
  }

  const pct = Math.round(progress * 100);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={toggle}
        disabled={!ready}
        className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent bg-surface-2 text-accent transition disabled:opacity-40 ${
          playing ? "play-pulse" : ""
        }`}
        aria-label={playing ? "Pause" : "Play snippet"}
      >
        <svg width="0" height="0">
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-accent-2)" />
            </linearGradient>
          </defs>
        </svg>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-border)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 46}`}
            strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress)}`}
            style={{ transition: playing ? "none" : "stroke-dashoffset 0.2s" }}
          />
        </svg>
        {!ready ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        ) : playing ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="text-sm text-text-dim">
        {pct === 100 && !playing ? `Played ${unlockedSeconds.toFixed(1)}s` : `Unlocked: ${unlockedSeconds.toFixed(1)}s`}
      </div>
    </div>
  );
}
