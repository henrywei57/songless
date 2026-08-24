# Songless

Live at **https://henrywei57.github.io/songless/**

A free daily song guessing game — a music version of Wordle. Every day you get three
tracks. You hear just two tenths of a second at first, and every wrong guess or skip
unlocks a longer snippet, up to a full fifteen seconds. Name the track in as few tries
as you can.

Everyone gets the same three songs each day for the default **Daily** mode, so you can
compare results with friends. There's nothing to install and no account to create —
scores are saved privately in your own browser (`localStorage`). No backend, no
database, no server-side secrets.

On top of the daily mode, you can also play:

- **A genre** — Pop, Hip-Hop, Rock, R&B, Country, Dance/Electronic, K-Pop, Latin, or
  Indie/Alternative.
- **An artist** — search any artist and get quizzed on their catalog.
- **Your own Spotify playlist** — log into Spotify (client-side only, see below) and
  play a daily mix pulled from any of your playlists.

## How it works

- **Audio & search** comes from Apple's free, keyless [iTunes Search
  API](https://performance-partners.apple.com/search-api), which returns a public
  30-second preview clip per track. This is what actually plays in the game.
- **The daily picks** are chosen with a seeded PRNG keyed off the UTC date (and the
  chosen genre/artist/playlist), so the "random" pick is deterministic — everyone
  looking at the same source on the same day gets the same three songs.
- **Spotify** is only used to read *your* playlists' track lists (name + artist) via
  the Web API's Authorization Code + PKCE flow — entirely client-side, no client
  secret, no server. Each track name is then cross-referenced against the iTunes
  Search API to find a playable preview, since Spotify's own preview URLs are no
  longer available to new API integrations.
- Everything — game progress, stats, streaks, your Spotify tokens — lives in
  `localStorage` in your browser. Nothing is sent to any server this app controls,
  because there isn't one.

## Running locally

```bash
npm install
npm run dev
```

## Connecting your own Spotify playlists

The "Your Spotify Playlist" mode needs a Spotify **Client ID**, which you provide
yourself (free, takes a minute):

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   and create an app.
2. In the app's settings, add a **Redirect URI** that exactly matches the URL you're
   running Songless from — `http://localhost:5173/songless/` in dev, or
   `https://henrywei57.github.io/songless/` on the deployed site. The app shows you
   the exact value to paste in.
3. Copy the app's **Client ID** and paste it into Songless when prompted.

That's it — no client secret is ever needed or requested.

## Tech

Vite + React + TypeScript + Tailwind CSS v4. No backend. Deployable as a static site
(Vercel, Netlify, GitHub Pages, etc.) — just be sure to add the deployed URL as a
Redirect URI in your Spotify app if you use the playlist mode.

```bash
npm run build   # outputs to dist/
```
