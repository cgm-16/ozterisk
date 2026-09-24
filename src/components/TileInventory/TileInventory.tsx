import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Tile as TileModel } from "../../game/types";
import { useI18n } from "../../i18n/I18nContext";
import { Tile } from "../Tile/Tile";
import { CLASSIC_START_CAPACITY } from "../../game/balance";
import { rackTier } from "./rackTier";
import styles from "./TileInventory.module.css";

/** A discard the rack is still drawing (8c): the hand as it stood before the
 * discard, and the ids whose exit has not yet played. */
interface Departure {
  tiles: readonly TileModel[];
  leaving: readonly string[];
  /** Rail tiles that survived, still to drop into the freed seats (8a·2). */
  seating: readonly string[];
  /** Every rail tile that survived, landed or not: none of them fires 9i. */
  seated: readonly string[];
  /** Each seating tile's offset from its seat to where it perched. */
  drops: Readonly<Record<string, { dx: number; dy: number }>>;
}

export interface TileInventoryProps {
  tiles: readonly TileModel[];
  mode: "select" | "discard" | "readOnly";
  pendingDiscards: readonly string[];
  /** Ids of tiles sitting in the answer slots. Each renders as an empty
   * socket in its own cell instead of a tile, so the rack never reflows. */
  liftedIds: readonly string[];
  /** Live capacity: the tiles seated, and the index past which tiles perch. */
  capacity: number;
  /** Classic: the rack steps its tile size with drawnCapacity and keeps closed
   * sockets as sealed plugs (§1.12). */
  stepped?: boolean;
  /** The capacity the rack is drawn at, which changes only at the round
   * change. Defaults to capacity. */
  drawnCapacity?: number;
  onTile(tileId: string): void;
  /** Called once a discard's departing tiles have all finished leaving. */
  onSettled?(): void;
}

/** Removes M6·1's inline frame, which would otherwise outrank a class's animation. */
function clearReseatFrame(cell: HTMLElement): void {
  for (const property of ["--fx", "--fy", "--fs", "transform-origin", "animation-name", "animation-duration", "animation-timing-function", "animation-fill-mode"]) {
    cell.style.removeProperty(property);
  }
}

/** Renders the fixed-socket rack, including lifted and departing tile states. */
export function TileInventory({
  tiles,
  mode,
  pendingDiscards,
  liftedIds,
  capacity,
  stepped = false,
  drawnCapacity = capacity,
  onTile,
  onSettled,
}: TileInventoryProps) {
  const { t } = useI18n();
  const [departure, setDeparture] = useState<Departure | null>(null);
  // A tile that leaves state unmounts, and CSS cannot animate an unmounted
  // node, so 8c has to be drawn from a copy the rack keeps. Both halves of
  // "which tile just left, and did it leave by discard" are only legible
  // against the previous render, because the TOGGLE_DISCARD that completes a
  // discard drops the tile in the same action that leaves the discard phase.
  // Adjusting state during render rather than in an effect keeps the held tile
  // on screen from the first frame after the drop, with no gap for it to
  // disappear in.
  //
  // The discard test is the phase the rack was in, not pendingDiscards. The
  // mark that reaches the required count completes the discard in the reducer,
  // so that tile goes straight from "not marked" to "gone" — it was never once
  // rendered with its id in pendingDiscards. `mode` is
  // "discard" for exactly the overflow phase, which is the one phase a tile
  // can leave the rack this way, and a submitted tile leaves from "select".
  const [previous, setPrevious] = useState({ tiles, mode });
  if (previous.tiles !== tiles) {
    const present = new Set(tiles.map((tile) => tile.id));
    const leaving =
      previous.mode === "discard"
        ? previous.tiles.filter((tile) => !present.has(tile.id)).map((tile) => tile.id)
        : [];
    setPrevious({ tiles, mode });
    // The tiles that were past capacity and are still held survived the
    // discard on the rail; the reducer has seated them in the freed sockets.
    const seating = previous.tiles
      .slice(capacity)
      .filter((tile) => present.has(tile.id))
      .map((tile) => tile.id);
    if (leaving.length > 0) {
      setDeparture({ tiles: previous.tiles, leaving, seating, seated: seating, drops: {} });
    }
  }

  // While a discard plays, the rack draws the hand as it stood before it. The
  // reducer has already seated a surviving rail tile in the freed socket, so
  // splicing the departing tile back into the new hand would shove every later
  // tile a cell over; the snapshot keeps each tile where the player saw it.
  const rackTiles = departure !== null && departure.leaving.length > 0 ? departure.tiles : tiles;
  const present = new Set(tiles.map((tile) => tile.id));

  // Retires one departing tile; the last one settles the discard. The next
  // round waits on this (§1.7), so a departure that never reported its end
  // would freeze the run — which is why a cancelled animation retires too.
  // Tiles leaving together end in the same frame and React batches their
  // handlers, so each retire is a functional update: read from the render's
  // closure, the second handler would restore the id the first removed.
  //
  // When the exits end, each surviving rail tile's seat is still on screen —
  // the departing tile it replaces holds it — so the fall 8a·2 draws is
  // measured then, from layout offsets, which transforms do not move.
  const measureDrops = (): Departure["drops"] => {
    const rack = rackRef.current;
    if (rack === null || departure === null) return {};
    const drops: Record<string, { dx: number; dy: number }> = {};
    for (const id of departure.seating) {
      const from = rack.querySelector<HTMLElement>(`[data-rail="${id}"]`);
      const to = rack.querySelector<HTMLElement>(`[data-cell="${tiles.findIndex((tile) => tile.id === id)}"]`);
      if (from && to) drops[id] = { dx: from.offsetLeft - to.offsetLeft, dy: from.offsetTop - to.offsetTop };
    }
    return drops;
  };
  const retire = (tileId: string) => {
    const drops = measureDrops();
    setDeparture((current) => {
      if (current === null) return current;
      const leaving = current.leaving.filter((id) => id !== tileId);
      return { ...current, leaving, drops: leaving.length > 0 ? current.drops : drops };
    });
  };
  const land = (tileId: string) =>
    setDeparture((current) =>
      current && { ...current, seating: current.seating.filter((id) => id !== tileId) },
    );
  const dropping =
    departure !== null && departure.leaving.length === 0 ? new Set(departure.seating) : new Set<string>();
  // A settled departure stays in state, drawn as no departure at all, until
  // the next discard replaces it; the effect only has to announce it, once.
  const settled =
    departure !== null && departure.leaving.length === 0 && departure.seating.length === 0;
  const onSettledRef = useRef(onSettled);
  useEffect(() => {
    onSettledRef.current = onSettled;
  });
  useEffect(() => {
    if (settled) onSettledRef.current?.();
  }, [settled]);
  const rackRef = useRef<HTMLDivElement>(null);
  // The native cancel listener below is bound once; these carry it the
  // current render's handlers, whose measurement reads the current hand.
  const retireRef = useRef(retire);
  const landRef = useRef(land);
  useEffect(() => {
    retireRef.current = retire;
    landRef.current = land;
  });
  useEffect(() => {
    // React has no onAnimationCancel, so the rack listens for it natively.
    const rack = rackRef.current;
    if (rack === null) return;
    // Swapping a cell's animation-name cancels the animation it replaces — a
    // reward tile discarded inside its 9i fire cancels oz-fire as its exit
    // starts — so only a cancel of the exit the cell is running retires it.
    const onCancel = (event: Event) => {
      const cell = (event.target as Element).closest("[data-departing], [data-seating]");
      if (!cell) return;
      const cancelled = (event as AnimationEvent).animationName;
      if (cancelled !== getComputedStyle(cell).animationName) return;
      const departing = cell.getAttribute("data-departing");
      const seating = cell.getAttribute("data-seating");
      if (departing) retireRef.current(departing);
      if (seating) landRef.current(seating);
    };
    // M6·1 writes its frame inline, and inline beats a class: left in place,
    // a re-seated tile discarded later in the run would keep computing
    // oz-reseat instead of its exit, start nothing, fire no animationend, and
    // freeze a round that no longer has a Next Round. So the frame is removed
    // the moment it ends, or is cancelled.
    const onReseatDone = (event: Event) => {
      const cell = event.target as HTMLElement;
      if ((event as AnimationEvent).animationName !== "oz-reseat" || !cell.dataset?.tile) return;
      clearReseatFrame(cell);
    };
    rack.addEventListener("animationcancel", onCancel);
    rack.addEventListener("animationend", onReseatDone);
    rack.addEventListener("animationcancel", onReseatDone);
    return () => {
      rack.removeEventListener("animationcancel", onCancel);
      rack.removeEventListener("animationend", onReseatDone);
      rack.removeEventListener("animationcancel", onReseatDone);
    };
  }, []);

  // M6·1: when the rack changes size, every tile flies from its old seat at
  // the old size to its new one (oz-reseat, a FLIP). Seats are read from
  // layout offsets after each commit; at a size change the offset and scale
  // from the old seat are written straight onto the cell before paint, so
  // the frame starts where the player last saw the tile. The re-sort that
  // shares the round change rides the same motion.
  const seats = useRef(new Map<string, { x: number; y: number; w: number }>());
  const shownTop = useRef<number | null>(null);
  const top = stepped ? rackTier(drawnCapacity).top : null;
  useLayoutEffect(() => {
    const rack = rackRef.current;
    if (rack === null) return;
    const cells = [...rack.querySelectorAll<HTMLElement>("[data-tile]")];
    const reseat = top !== null && shownTop.current !== null && shownTop.current !== top;
    // Clearing first lets a second re-seat in the run restart the frame.
    if (reseat) for (const cell of cells) cell.style.animationName = "";
    const now = new Map(
      cells.map((cell) => [
        cell.dataset.tile ?? "",
        { x: cell.offsetLeft, y: cell.offsetTop, w: cell.offsetWidth },
      ]),
    );
    if (reseat) {
      for (const cell of cells) {
        const from = seats.current.get(cell.dataset.tile ?? "");
        const to = now.get(cell.dataset.tile ?? "");
        if (!from || !to) continue;
        cell.style.setProperty("--fx", `${from.x - to.x}px`);
        cell.style.setProperty("--fy", `${from.y - to.y}px`);
        cell.style.setProperty("--fs", String(to.w > 0 ? from.w / to.w : 1));
        cell.style.transformOrigin = "0 0";
        cell.style.animationDuration = "var(--dur-reseat)";
        cell.style.animationTimingFunction = "var(--ease-settle)";
        cell.style.animationFillMode = "both";
        cell.style.animationName = "oz-reseat";
      }
    }
    // A tile discarded mid-re-seat leaves by its own exit at once; the
    // re-seat's cancel is then not the exit the cell runs, so it retires nothing.
    for (const cell of rack.querySelectorAll<HTMLElement>("[data-departing]")) clearReseatFrame(cell);
    seats.current = now;
    shownTop.current = top;
  });

  // §1.12: the live capacity's sockets always render — the empty sockets are
  // the score. Classic draws whole rows for its size's top capacity, and every
  // cell past the live capacity is a sealed plug: the rack is always a full
  // rectangle, and the plug count is the descent. Tiles past the live capacity
  // never add a row; they perch on the rail above.
  //
  // Which size, and where it falls back to 6 x 44, is CSS's: a container
  // query on the rack, because narrow is a property of the container and not
  // the viewport (§1.12) — a min-width query fires about 15px early wherever a
  // scrollbar takes layout width. Resolved in style, the first frame is
  // already the right size.
  const tier = stepped ? rackTier(drawnCapacity) : null;
  const footprint = tier ? tier.footprint : capacity;
  const perched = rackTiles.slice(capacity);

  const renderTile = (tile: TileModel, cell: number | null) => {
    const onRail = cell === null;
    const place = onRail ? { "data-rail": tile.id } : { "data-cell": cell, "data-tile": tile.id };
    if (!present.has(tile.id)) {
      // The reducer has already dropped this tile and nothing outside the
      // rack needs to know it is still drawn, so it carries no role and is
      // hidden: it has left the game. Retired on animationend rather than
      // on a timer, which would be a second source of truth for a duration
      // the stylesheet owns — and under prefers-reduced-motion the global
      // 0.01ms rule still fires the event, so the same path retires the
      // tile instantly with no branch for it.
      return (
        <div
          key={tile.id}
          className={`${styles.cell} ${styles.cellDeparting}`}
          aria-hidden="true"
          {...place}
          data-departing={tile.id}
          onAnimationEnd={() => retire(tile.id)}
        >
          <Tile digit={tile.digit} state="marked" />
        </div>
      );
    }

    if (liftedIds.includes(tile.id)) {
      // A lifted cell is a socket, not a styled Tile: the tile it holds
      // is already named in the answer slots, so this cell must carry
      // no button role and no accessible name of its own.
      return <div key={tile.id} className={`${styles.socket} ${styles.socketLifted}`} {...place} />;
    }

    const isMarkedForDiscard = mode === "discard" && pendingDiscards.includes(tile.id);
    const labelParts = [t("tile.digitLabel", { digit: tile.digit })];
    if (tile.isNew) labelParts.push(t("tile.newLabel"));
    if (isMarkedForDiscard) labelParts.push(t("tile.discardLabel"));

    // 8a and 9i collide on the cells past capacity, which hold the newest
    // arrivals — reward tiles, almost every time (§1.5 step 7). Those are
    // the arrivals that did not land, so they rim-reject instead of firing.
    // One that later drops into a freed seat is still new until the round
    // changes, and firing then would start it from nothing in its seat.
    const moment =
      onRail
        ? ` ${styles.cellRimReject}`
        : tile.isNew && !departure?.seated.includes(tile.id)
          ? ` ${styles.cellNew}`
          : "";

    // 8a·2: a rail tile the discard spared falls into the seat it freed, from
    // where it perched. It is mounted in that seat and flies in from the rail.
    const drop = !onRail && dropping.has(tile.id) ? (departure?.drops[tile.id] ?? { dx: 0, dy: 0 }) : null;
    if (drop !== null) {
      return (
        <div
          key={tile.id}
          className={`${styles.cell} ${styles.cellPerchDrop}`}
          style={{ "--dx": `${drop.dx}px`, "--dy": `${drop.dy}px` } as CSSProperties}
          {...place}
          data-seating={tile.id}
          onAnimationEnd={() => land(tile.id)}
        >
          <Tile digit={tile.digit} state="disabled" label={labelParts.join(", ")} />
        </div>
      );
    }

    return (
      <div key={tile.id} className={`${styles.cell}${moment}`} {...place}>
        <Tile
          digit={tile.digit}
          state={
            isMarkedForDiscard
              ? "marked"
              : mode === "readOnly"
                ? "disabled"
                : tile.isNew
                  ? "reward"
                  : "resting"
          }
          label={labelParts.join(", ")}
          pressed={mode === "discard" ? isMarkedForDiscard : undefined}
          onClick={() => onTile(tile.id)}
        />
      </div>
    );
  };

  // A plug past its size's top capacity appears only when that size is first
  // drawn, so it seals in front of the player: the house plug 240ms into the
  // run (M6·0), a new size's plugs 40ms apart once the re-seat has landed
  // (M6·2). The socket a seal took this submission closes at once (M6). Keyed
  // by kind and size, each seals on mount and rests sealed after: the socket
  // that closed at a size change's submission is a new size's first plug, and
  // remounts to seal again rather than rewind.
  const renderSeal = (index: number, delay: string | undefined) => (
    <div key={`seal-${tier?.top}-${index}`} className={`${styles.plug} ${styles.sealing}`} aria-hidden="true" data-cell={index}>
      <span className={styles.sealWell} style={{ animationDelay: delay }} />
      <span className={styles.sealRim} style={{ animationDelay: delay }} />
    </div>
  );
  const renderClosed = (index: number) => {
    if (index < drawnCapacity) return renderSeal(index, undefined);
    if (tier === null || index < tier.top) {
      return <div key={`plug-${index}`} className={styles.plug} aria-hidden="true" data-cell={index} />;
    }
    const delay = tier.top === CLASSIC_START_CAPACITY ? 240 : 300 + (index - tier.top) * 40;
    return renderSeal(index, `${delay}ms`);
  };

  return (
    <div ref={rackRef} className={styles.rack} data-size={tier?.size}>
      {/* Gotcha: the rail is in flow above the tray and unmounts in the
          commit that starts the last perch-drop, so the tray jumps up by the
          rail's height as the tile falls. The drop still lands true (both ends
          are measured in one layout). Keeping the rail until the tile lands is
          deferred to the §7.6 review; see the 2026-09-24 journal. */}
      {perched.length > 0 && (
        <div className={`${styles.rail}${tier ? ` ${styles.railOverTray}` : ""}`}>
          {perched.map((tile) => renderTile(tile, null))}
        </div>
      )}
      <div className={`${styles.inventory}${tier ? ` ${styles.tray}` : ""}`}>
        {Array.from({ length: footprint }, (_, index) => {
          if (index >= capacity) return renderClosed(index);
          const tile = rackTiles[index];
          if (tile === undefined) return <div key={`empty-${index}`} className={styles.socket} />;
          return renderTile(tile, index);
        })}
      </div>
    </div>
  );
}
