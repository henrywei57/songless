import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameSource, GameState, RoundState, Track } from "../lib/types";
import { MAX_ATTEMPTS } from "../lib/gameConfig";
import { isTitleMatch } from "../lib/match";
import { readJSON, writeJSON, gameKey, statsKey, emptyStats, type SourceStats } from "../lib/storage";
import { todayKey } from "../lib/rng";

function buildInitialState(source: GameSource, tracks: Track[]): GameState {
  return {
    source,
    dateKey: todayKey(),
    rounds: tracks.map((track) => ({ track, attempts: [], status: "playing" as const })),
    currentRound: 0,
    finished: tracks.length === 0,
  };
}

function applyStatsForRound(sourceKey: string, round: RoundState) {
  const key = statsKey(sourceKey);
  const stats = readJSON<SourceStats>(key, emptyStats());
  stats.played += 1;
  if (round.status === "won") {
    stats.won += 1;
    const attemptCount = round.attempts.filter((a) => a.kind === "guess" || a.kind === "skip").length;
    stats.distribution[Math.min(attemptCount - 1, 5)] += 1;
    stats.currentStreak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  } else {
    stats.distribution[6] += 1;
    stats.currentStreak = 0;
  }
  writeJSON(key, stats);
}

// Note: state mutations that trigger a stats write (a side effect) must NOT run inside a
// setState updater function — React 18 StrictMode intentionally invokes updater functions
// twice in development to surface impure updates, which would double-record stats. Instead,
// every mutation here reads the latest state from a ref and calls setState with a plain
// pre-computed value from inside the event handler itself, which StrictMode does not replay.
export function useGame(source: GameSource | null, tracks: Track[] | null) {
  const storageKey = source ? gameKey(`${source.kind}:${source.key}`, todayKey()) : null;

  const [state, setState] = useState<GameState | null>(null);
  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;

  useEffect(() => {
    if (!source || !tracks) {
      setState(null);
      return;
    }
    const key = gameKey(`${source.kind}:${source.key}`, todayKey());
    const existing = readJSON<GameState | null>(key, null);
    if (existing && existing.rounds.length === tracks.length) {
      setState(existing);
    } else {
      setState(buildInitialState(source, tracks));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.kind, source?.key, tracks]);

  useEffect(() => {
    if (state && storageKey) writeJSON(storageKey, state);
  }, [state, storageKey]);

  const currentRound = useMemo(() => (state ? state.rounds[state.currentRound] : null), [state]);

  const submitGuess = useCallback((value: string) => {
    const prev = stateRef.current;
    if (!prev) return;
    const round = { ...prev.rounds[prev.currentRound] };
    if (round.status !== "playing") return;
    const correct = isTitleMatch(value, round.track.title);
    round.attempts = [...round.attempts, { kind: "guess" as const, value, correct }];
    if (correct) {
      round.status = "won";
    } else if (round.attempts.length >= MAX_ATTEMPTS) {
      round.status = "lost";
    }
    if (round.status !== "playing") {
      applyStatsForRound(`${prev.source.kind}:${prev.source.key}`, round);
    }
    const rounds = prev.rounds.slice();
    rounds[prev.currentRound] = round;
    setState({ ...prev, rounds });
  }, []);

  const skip = useCallback(() => {
    const prev = stateRef.current;
    if (!prev) return;
    const round = { ...prev.rounds[prev.currentRound] };
    if (round.status !== "playing") return;
    round.attempts = [...round.attempts, { kind: "skip" as const }];
    if (round.attempts.length >= MAX_ATTEMPTS) {
      round.status = "lost";
      applyStatsForRound(`${prev.source.kind}:${prev.source.key}`, round);
    }
    const rounds = prev.rounds.slice();
    rounds[prev.currentRound] = round;
    setState({ ...prev, rounds });
  }, []);

  const nextRound = useCallback(() => {
    const prev = stateRef.current;
    if (!prev) return;
    const next = prev.currentRound + 1;
    if (next >= prev.rounds.length) {
      setState({ ...prev, finished: true });
    } else {
      setState({ ...prev, currentRound: next });
    }
  }, []);

  return { state, currentRound, submitGuess, skip, nextRound };
}
