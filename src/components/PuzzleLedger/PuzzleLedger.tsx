import type { PuzzleTable, RoundResult } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { EquationBoard } from "../EquationBoard/EquationBoard";
import { Tile } from "../Tile/Tile";
import styles from "./PuzzleLedger.module.css";

export interface PuzzleLedgerProps {
  table: PuzzleTable;
  /** The displayed round, 1-based: row `round` is the current row. */
  round: number;
  rowResults: readonly RoundResult["kind"][];
}

/**
 * Puzzle's table, face up: every row with the tiles it pays, and the played
 * rows marked. Each row reads as one sentence; what it draws is hidden from
 * assistive tech, so the equation and pay digits are not announced twice.
 *
 * The current row and a played row are independent: in feedback the row just
 * submitted is both, so it keeps its frame and its EquationBoard while it shows
 * its mark.
 */
export function PuzzleLedger({ table, round, rowResults }: PuzzleLedgerProps) {
  const { t, language } = useI18n();
  const payList = new Intl.ListFormat(language, { type: "conjunction" });

  return (
    <ol className={styles.ledger} aria-label={t("ledger.label")}>
      {table.rows.map(({ equation, pay }, index) => {
        const result = index < rowResults.length ? rowResults[index] : undefined;
        const current = index === round - 1;
        const label = t("ledger.row", {
          row: index + 1,
          left: equation.left,
          right: equation.right,
          pay: payList.format(pay.map(String)),
        });
        const className = [styles.row, current && styles.current, result && styles.played]
          .filter(Boolean)
          .join(" ");

        return (
          <li key={index} className={className} aria-current={current ? "step" : undefined}>
            <span className={styles.label}>
              {result === undefined
                ? label
                : `${label}, ${t(result === "correct" ? "ledger.answered" : "ledger.missed")}`}
            </span>
            <div className={styles.visual} aria-hidden="true">
              <span className={styles.number}>{index + 1}</span>
              {/* EquationBoard mounts with the row that becomes current, so its
                  10b rise plays as the row arrives. */}
              {current ? (
                <EquationBoard equation={equation} />
              ) : (
                <span className={styles.equation}>{`${equation.left} × ${equation.right}`}</span>
              )}
              {/* Ink, not jade or vermilion: a played row is history, and
                  semantic colour belongs to the moment of the event (§1.12). */}
              {result === undefined ? (
                <span className={styles.pay}>
                  {pay.map((digit, payIndex) => (
                    <Tile key={payIndex} value={{ digit }} size="sm" />
                  ))}
                </span>
              ) : (
                <span className={styles.mark}>{result === "correct" ? "✓" : "✗"}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
