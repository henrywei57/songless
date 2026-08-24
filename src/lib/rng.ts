function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(seed: string): () => number {
  return mulberry32(hashString(seed));
}

/** Deterministically shuffles a copy of the array using a seeded RNG. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rand = seededRandom(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Picks `count` deterministic items from `items` for the given seed. */
export function seededPick<T>(items: T[], count: number, seed: string): T[] {
  return seededShuffle(items, seed).slice(0, count);
}

/** UTC date key like 2026-08-24, stable for all users regardless of timezone. */
export function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Day index since epoch, used for the "#N" style puzzle number. */
export function dayNumber(): number {
  return Math.floor(Date.now() / 86400000) - Math.floor(new Date("2024-01-01T00:00:00Z").getTime() / 86400000);
}
