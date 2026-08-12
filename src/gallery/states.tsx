import type { ReactNode } from "react";
import { TitleScreen } from "../components/TitleScreen/TitleScreen";
import type { GamePhase } from "../game/types";

export interface GalleryEntry {
  /** Stable across renders; used as the picker's React key. */
  id: string;
  /** Picker label. English only — the gallery is a dev tool, not a screen. */
  label: string;
  render: () => ReactNode;
}

// Keyed by phase so that adding a GamePhase member fails typecheck until the
// gallery covers it. A flat array with a hand-written phase list would rot
// silently, which is the failure this structure exists to prevent.
export const GALLERY_STATES: Record<GamePhase, GalleryEntry[]> = {
  title: [{ id: "title", label: "Title", render: () => <TitleScreen onStart={() => {}} /> }],
  answering: [],
  feedback: [],
  overflow: [],
  gameOver: [],
};
