/* eslint-disable prettier/prettier */
/**
 * bracket-structure.ts
 *
 * Defines the static tournament tree for the FIFA World Cup 2026 knockout stage.
 *
 * Structure:
 *   - 16 R32 matches → 8 R16 matches → 4 QF → 2 SF → 1 Final (+ 3rd place)
 *   - The bracket is split into LEFT (slots 0–7) and RIGHT (slots 8–15) halves
 *   - Left side: R32[0–7] → R16[0–3] → QF[0–1] → SF[0] → Final
 *   - Right side: R32[8–15] → R16[4–7] → QF[2–3] → SF[1] → Final
 *
 * Each BracketSlot represents one match position in the tree.
 * `sourceSlots` links back to the two parent slots that feed this match.
 */

import type { Stage } from "@/lib/types";

export interface BracketSlot {
  /** Unique identifier for this slot in the bracket tree */
  slotId: string;
  /** Stage this slot belongs to */
  stage: Stage;
  /**
   * Which half of the bracket this slot belongs to.
   * "left" = top half, "right" = bottom half (mirrored).
   * "center" = Final and 3rd place.
   */
  side: "left" | "right" | "center";
  /**
   * Index within the stage+side group (0-based).
   * Used to calculate vertical alignment.
   */
  index: number;
  /**
   * The two parent slot IDs whose winners play in this slot.
   * undefined for R32 (first round — no parents).
   */
  sourceSlots?: [string, string];
}

/**
 * Full ordered list of all bracket slots.
 * Order matches the visual layout: left columns → center → right columns.
 */
export const bracketSlots: BracketSlot[] = [
  // ── LEFT SIDE ──────────────────────────────────────────────────────────────

  // R32 left (8 matches, indices 0–7)
  { slotId: "r32-l0", stage: "r32", side: "left", index: 0 },
  { slotId: "r32-l1", stage: "r32", side: "left", index: 1 },
  { slotId: "r32-l2", stage: "r32", side: "left", index: 2 },
  { slotId: "r32-l3", stage: "r32", side: "left", index: 3 },
  { slotId: "r32-l4", stage: "r32", side: "left", index: 4 },
  { slotId: "r32-l5", stage: "r32", side: "left", index: 5 },
  { slotId: "r32-l6", stage: "r32", side: "left", index: 6 },
  { slotId: "r32-l7", stage: "r32", side: "left", index: 7 },

  // R16 left (4 matches)
  { slotId: "r16-l0", stage: "r16", side: "left", index: 0, sourceSlots: ["r32-l0", "r32-l1"] },
  { slotId: "r16-l1", stage: "r16", side: "left", index: 1, sourceSlots: ["r32-l2", "r32-l3"] },
  { slotId: "r16-l2", stage: "r16", side: "left", index: 2, sourceSlots: ["r32-l4", "r32-l5"] },
  { slotId: "r16-l3", stage: "r16", side: "left", index: 3, sourceSlots: ["r32-l6", "r32-l7"] },

  // QF left (2 matches)
  { slotId: "qf-l0", stage: "qf", side: "left", index: 0, sourceSlots: ["r16-l0", "r16-l1"] },
  { slotId: "qf-l1", stage: "qf", side: "left", index: 1, sourceSlots: ["r16-l2", "r16-l3"] },

  // SF left (1 match)
  { slotId: "sf-l0", stage: "sf", side: "left", index: 0, sourceSlots: ["qf-l0", "qf-l1"] },

  // ── CENTER ─────────────────────────────────────────────────────────────────

  // Final
  { slotId: "final-c0", stage: "final", side: "center", index: 0, sourceSlots: ["sf-l0", "sf-r0"] },

  // 3rd Place
  { slotId: "third-c0", stage: "third", side: "center", index: 0 },

  // ── RIGHT SIDE (mirror of left) ────────────────────────────────────────────

  // SF right (1 match)
  { slotId: "sf-r0", stage: "sf", side: "right", index: 0, sourceSlots: ["qf-r0", "qf-r1"] },

  // QF right (2 matches)
  { slotId: "qf-r0", stage: "qf", side: "right", index: 0, sourceSlots: ["r16-r0", "r16-r1"] },
  { slotId: "qf-r1", stage: "qf", side: "right", index: 1, sourceSlots: ["r16-r2", "r16-r3"] },

  // R16 right (4 matches)
  { slotId: "r16-r0", stage: "r16", side: "right", index: 0, sourceSlots: ["r32-r0", "r32-r1"] },
  { slotId: "r16-r1", stage: "r16", side: "right", index: 1, sourceSlots: ["r32-r2", "r32-r3"] },
  { slotId: "r16-r2", stage: "r16", side: "right", index: 2, sourceSlots: ["r32-r4", "r32-r5"] },
  { slotId: "r16-r3", stage: "r16", side: "right", index: 3, sourceSlots: ["r32-r6", "r32-r7"] },

  // R32 right (8 matches)
  { slotId: "r32-r0", stage: "r32", side: "right", index: 0 },
  { slotId: "r32-r1", stage: "r32", side: "right", index: 1 },
  { slotId: "r32-r2", stage: "r32", side: "right", index: 2 },
  { slotId: "r32-r3", stage: "r32", side: "right", index: 3 },
  { slotId: "r32-r4", stage: "r32", side: "right", index: 4 },
  { slotId: "r32-r5", stage: "r32", side: "right", index: 5 },
  { slotId: "r32-r6", stage: "r32", side: "right", index: 6 },
  { slotId: "r32-r7", stage: "r32", side: "right", index: 7 },
];

/**
 * The ordered column layout for the visual bracket.
 * Each column is rendered left-to-right.
 */
export interface BracketColumn {
  stage: Stage;
  side: "left" | "right" | "center";
  label: string; // i18n key — resolved by the component
  slots: BracketSlot[];
}

export const bracketColumns: BracketColumn[] = [
  {
    stage: "r32",
    side: "left",
    label: "r32",
    slots: bracketSlots.filter((s) => s.stage === "r32" && s.side === "left"),
  },
  {
    stage: "r16",
    side: "left",
    label: "r16",
    slots: bracketSlots.filter((s) => s.stage === "r16" && s.side === "left"),
  },
  {
    stage: "qf",
    side: "left",
    label: "qf",
    slots: bracketSlots.filter((s) => s.stage === "qf" && s.side === "left"),
  },
  {
    stage: "sf",
    side: "left",
    label: "sf",
    slots: bracketSlots.filter((s) => s.stage === "sf" && s.side === "left"),
  },
  {
    stage: "final",
    side: "center",
    label: "final",
    slots: bracketSlots.filter((s) => s.stage === "final" || s.stage === "third"),
  },
  {
    stage: "sf",
    side: "right",
    label: "sf",
    slots: bracketSlots.filter((s) => s.stage === "sf" && s.side === "right"),
  },
  {
    stage: "qf",
    side: "right",
    label: "qf",
    slots: bracketSlots.filter((s) => s.stage === "qf" && s.side === "right"),
  },
  {
    stage: "r16",
    side: "right",
    label: "r16",
    slots: bracketSlots.filter((s) => s.stage === "r16" && s.side === "right"),
  },
  {
    stage: "r32",
    side: "right",
    label: "r32",
    slots: bracketSlots.filter((s) => s.stage === "r32" && s.side === "right"),
  },
];

/**
 * Maps each bracket slot to the correct ESPN match index within its stage array.
 *
 * The ESPN API returns matches sorted by kickoff date. The interleave order
 * (left=even, right=odd) does NOT match the official FIFA bracket — verified
 * against the live ESPN scoreboard on 2026-07-01.
 *
 * Derived from the r16/qf/sf "Winner" references in ESPN event names:
 *   - sf[0] ← qf[0]+qf[1] ← r16[0,1,4,5] ← r32[0,3,2,5,8,9,10,11]  → LEFT half
 *   - sf[1] ← qf[2]+qf[3] ← r16[2,3,6,7] ← r32[1,4,6,7,12,13,14,15] → RIGHT half
 */
const SLOT_INDEX_MAP: Record<string, number> = {
  // r32 LEFT  (slot index → ESPN array index)
  "r32-left-0": 0, // Canada at South Africa
  "r32-left-1": 3, // Morocco at Netherlands
  "r32-left-2": 2, // Paraguay at Germany
  "r32-left-3": 5, // Sweden at France
  "r32-left-4": 8, // Senegal at Belgium
  "r32-left-5": 9, // Bosnia-Herzegovina at United States
  "r32-left-6": 10, // Austria at Spain
  "r32-left-7": 11, // Croatia at Portugal
  // r32 RIGHT
  "r32-right-0": 1, // Japan at Brazil
  "r32-right-1": 4, // Norway at Ivory Coast
  "r32-right-2": 6, // Ecuador at Mexico
  "r32-right-3": 7, // Congo DR at England
  "r32-right-4": 12, // Algeria at Switzerland
  "r32-right-5": 14, // Cape Verde at Argentina
  "r32-right-6": 13, // Egypt at Australia
  "r32-right-7": 15, // Ghana at Colombia
  // r16 LEFT
  "r16-left-0": 0, // Morocco at Canada
  "r16-left-1": 1, // France at Paraguay
  "r16-left-2": 4, // R32-12 vs R32-11
  "r16-left-3": 5, // R32-10 vs R32-9
  // r16 RIGHT
  "r16-right-0": 2, // Norway at Brazil
  "r16-right-1": 3, // R32-8 at Mexico
  "r16-right-2": 6, // R32-16 vs R32-14
  "r16-right-3": 7, // R32-15 vs R32-13
  // qf LEFT
  "qf-left-0": 0, // R16-2 vs R16-1
  "qf-left-1": 1, // R16-6 vs R16-5
  // qf RIGHT
  "qf-right-0": 2, // R16-4 vs R16-3
  "qf-right-1": 3, // R16-8 vs R16-7
  // sf
  "sf-left-0": 0, // QF-2 vs QF-1
  "sf-right-0": 1, // QF-4 vs QF-3
  // center
  "final-center-0": 0,
  "third-center-0": 0,
};

export function getMatchIndexForSlot(slot: BracketSlot, _totalInStage: number): number {
  const key = `${slot.stage}-${slot.side}-${slot.index}`;
  const idx = SLOT_INDEX_MAP[key];
  if (idx === undefined) {
    console.warn(`[bracket] No index mapping for slot key: ${key}`);
    return slot.index;
  }
  return idx;
}
