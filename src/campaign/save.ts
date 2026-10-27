import { CHAPTERS } from "./content";
import { freshCampaign, type Campaign } from "./state";
import { decodeSave, SAVE_KEY } from "../game/save";
export const CAMPAIGN_KEY = "road-letters-prologue-v3";
function structure(sample: unknown, value: unknown): boolean {
  // Nullable unions (escape object and route string) are checked explicitly below.
  if (sample === null) return true;
  if (Array.isArray(sample)) return Array.isArray(value);
  if (typeof sample === "number")
    return typeof value === "number" && Number.isFinite(value);
  if (typeof sample === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return false;
    return Object.entries(sample as Record<string, unknown>).every(
      ([key, expected]) =>
        structure(expected, (value as Record<string, unknown>)[key]),
    );
  }
  return typeof value === typeof sample;
}
export function decodeCampaign(raw: string | null): Campaign | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Campaign;
    if (
      !structure(freshCampaign(), s) ||
      s.version !== 3 ||
      !CHAPTERS.some((c) => c.id === s.chapter)
    )
      return null;
    if (s.escape !== null && !decodeSave(JSON.stringify(s.escape))) return null;
    if (!s.completed.every((id) => CHAPTERS.some((c) => c.id === id)))
      return null;
    for (const list of [
      s.journal,
      s.memories,
      s.flags,
      s.log,
      s.road.choices,
      s.berea.explorer.found,
      s.berea.explorer.checkpoint.found,
      s.athens.explorer.found,
      s.athens.explorer.checkpoint.found,
      s.athens.understood,
      s.athens.responses,
      s.workshop.completedOrders,
      s.workshop.encounters,
      s.workshop.schedule,
      s.coast.clues,
    ])
      if (!list.every((v) => typeof v === "string")) return null;
    if (
      !["walking", "setback", "arrived"].includes(s.road.status) ||
      !["steady", "quick", "careful"].includes(s.road.pace) ||
      !["open", "sheltered"].includes(s.road.route)
    )
      return null;
    if (
      s.road.km < 0 ||
      s.road.km > 78 ||
      s.road.water < 0 ||
      s.road.food < -1 ||
      s.road.fatigue < 0 ||
      s.road.hours < 0 ||
      !Number.isInteger(s.revision) ||
      s.revision < 0 ||
      !["table", "crisis", "departed"].includes(s.berea.phase) ||
      !["explore", "argument", "responses"].includes(s.athens.phase)
    )
      return null;
    if (
      !["escort", "choice", "sea", "land", "arrived"].includes(s.coast.stage) ||
      ![null, "sea", "land"].includes(s.coast.route) ||
      s.coast.progress > 5 ||
      s.coast.approach > 4
    )
      return null;
    if (
      !["craft", "report", "memory", "done"].includes(s.workshop.phase) ||
      !["layout", "cut", "stitched"].includes(s.workshop.stage) ||
      s.workshop.order > 3 ||
      s.workshop.hours > 6
    )
      return null;
    if (
      !s.workshop.placements.every((p) =>
        structure({ id: "", x: 0, y: 0, rotated: false }, p),
      )
    )
      return null;
    if (
      !["arrival", "reading", "community"].includes(s.letter.phase) ||
      s.letter.page > 4 ||
      !s.letter.heard.every((n) => Number.isInteger(n) && n >= 0 && n < 5)
    )
      return null;
    for (const nav of [s.berea.explorer, s.athens.explorer])
      if (
        !Number.isInteger(nav.position.x) ||
        !Number.isInteger(nav.position.y) ||
        nav.position.x < 0 ||
        nav.position.y < 0 ||
        nav.position.x > 6 ||
        nav.position.y > 4 ||
        nav.turn < 0
      )
        return null;
    for (const modern of Object.values(s.modern))
      if (
        !structure(
          { plan: {}, inspected: [], response: "", complete: false },
          modern,
        )
      )
        return null;
    return s;
  } catch {
    return null;
  }
}
export function migrateSave(
  legacy: string | null,
  current: string | null = null,
): Campaign {
  return decodeCampaign(current) ?? freshCampaign(decodeSave(legacy));
}
export function readCampaign(): Campaign {
  try {
    return migrateSave(
      localStorage.getItem(SAVE_KEY),
      localStorage.getItem(CAMPAIGN_KEY),
    );
  } catch {
    return freshCampaign();
  }
}
export function writeCampaign(state: Campaign): boolean {
  try {
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
