import { tileDigits } from "../../game/selectors";
import type { TileValue } from "../../game/types";
import type { I18nValue } from "../../i18n/types";

const LETTERS = { wild: "✳", odd: "O", even: "E" } as const;

// What a tile engraves: its digit, a letter for Wildcard and the parities, or
// its range with an en dash (§1.12).
export function tileGlyph(value: TileValue): string {
  if ("digit" in value) return String(value.digit);
  if (value.face === "wild" || value.face === "odd" || value.face === "even") return LETTERS[value.face];
  const digits = tileDigits(value);
  return `${digits[0]}–${digits[digits.length - 1]}`;
}

// The spoken name a digit tile's "Digit {digit}" gives (§1.14).
export function tileLabel(value: TileValue, t: I18nValue["t"]): string {
  if ("digit" in value) return t("tile.digitLabel", { digit: value.digit });
  if (value.face !== "nbr") return t(`tile.face.${value.face}`);
  return t("tile.face.nbr", { low: value.centre - 1, high: value.centre + 1 });
}
