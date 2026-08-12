import { useState } from "react";
import { LanguageToggle } from "../components/LanguageToggle/LanguageToggle";
import { GALLERY_STATES } from "./states";
import styles from "./Gallery.module.css";

// Skip empty groups entirely rather than rendering an empty heading.
const GROUPS = Object.entries(GALLERY_STATES).filter(([, entries]) => entries.length > 0);
const ALL_ENTRIES = GROUPS.flatMap(([, entries]) => entries);

export function Gallery() {
  const [selectedId, setSelectedId] = useState(ALL_ENTRIES[0]?.id);
  const selected = ALL_ENTRIES.find((entry) => entry.id === selectedId);

  return (
    <div className={styles.gallery}>
      <nav className={styles.picker}>
        <LanguageToggle />
        {GROUPS.map(([phase, entries]) => (
          <div key={phase} className={styles.group}>
            <h2 className={styles.groupHeading}>{phase}</h2>
            <ul className={styles.list}>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={styles.entryButton}
                    aria-pressed={entry.id === selectedId}
                    onClick={() => setSelectedId(entry.id)}
                  >
                    {entry.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className={styles.stage}>{selected?.render()}</div>
    </div>
  );
}
