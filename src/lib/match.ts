export function normalizeTitle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\(feat[^)]*\)/g, "")
    .replace(/\(with[^)]*\)/g, "")
    .replace(/\(remaster[^)]*\)/g, "")
    .replace(/\(live[^)]*\)/g, "")
    .replace(/\(radio edit\)/g, "")
    .replace(/\(single version\)/g, "")
    .replace(/-\s*remaster.*/g, "")
    .replace(/feat\..*/g, "")
    .replace(/&.*$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isTitleMatch(guess: string, title: string): boolean {
  const g = normalizeTitle(guess);
  const t = normalizeTitle(title);
  if (!g) return false;
  if (g === t) return true;
  if (t.startsWith(g) && g.length >= Math.min(4, t.length)) return true;
  if (g.startsWith(t) && t.length >= Math.min(4, g.length)) return true;
  return false;
}
