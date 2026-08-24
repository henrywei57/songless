/** Seconds of audio unlocked before each attempt (index 0 = first listen). */
export const SNIPPET_DURATIONS = [0.2, 1, 2, 4, 7, 15];
export const MAX_ATTEMPTS = SNIPPET_DURATIONS.length;

export function durationForAttempt(attemptsMade: number): number {
  const idx = Math.min(attemptsMade, SNIPPET_DURATIONS.length - 1);
  return SNIPPET_DURATIONS[idx];
}
