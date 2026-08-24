const PREFIX = "songless:";

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable; fail silently, game still works this session
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export interface SourceStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  /** distribution[i] = number of rounds solved on attempt i+1, distribution[6] = failed */
  distribution: number[];
  lastPlayedDate?: string;
}

export function emptyStats(): SourceStats {
  return { played: 0, won: 0, currentStreak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0, 0] };
}

export function statsKey(sourceKey: string): string {
  return `stats:${sourceKey}`;
}

export function gameKey(sourceKey: string, dateKey: string): string {
  return `game:${sourceKey}:${dateKey}`;
}
