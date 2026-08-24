export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  previewUrl: string;
}

export type SourceKind = "daily" | "genre" | "artist" | "playlist";

export interface GameSource {
  kind: SourceKind;
  key: string;
  label: string;
}

export type AttemptKind = "guess" | "skip";

export interface Attempt {
  kind: AttemptKind;
  value?: string;
  correct?: boolean;
}

export type RoundStatus = "playing" | "won" | "lost";

export interface RoundState {
  track: Track;
  attempts: Attempt[];
  status: RoundStatus;
}

export interface GameState {
  source: GameSource;
  dateKey: string;
  rounds: RoundState[];
  currentRound: number;
  finished: boolean;
}
