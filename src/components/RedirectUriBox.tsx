import { useState } from "react";
import { getRedirectUri } from "../lib/spotify";

export default function RedirectUriBox() {
  const [copied, setCopied] = useState(false);
  const uri = getRedirectUri();

  async function copy() {
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="scrollbar-thin flex-1 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 text-xs text-accent">
        {uri}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-text-dim transition hover:border-accent hover:text-text"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
