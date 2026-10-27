import { freshGame, tileAt, type GameState, type Snapshot } from './engine';
export const SAVE_KEY = 'road-letters-thessalonica-v1';
const validSnapshot = (s: unknown): s is Snapshot => {
  if (!s || typeof s !== 'object') return false;
  const v = s as Snapshot;
  return !!v.position && Number.isInteger(v.position.x) && Number.isInteger(v.position.y)
    && tileAt(v.position) !== 'wall' && Number.isSafeInteger(v.turn) && v.turn >= 0
    && Array.isArray(v.contacts) && v.contacts.length <= 2 && new Set(v.contacts).size === v.contacts.length
    && v.contacts.every(c => c === 'weaver' || c === 'baker');
};
export function decodeSave(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as GameState | null;
    if (!s || typeof s !== 'object' || s.version !== 1 || !validSnapshot(s) || !validSnapshot(s.checkpoint)
      || !['playing', 'caught', 'escaped'].includes(s.status ?? '') || s.checkpoint.turn > s.turn
      || !Array.isArray(s.events) || !s.events.every((e: unknown) => typeof e === 'string')) return null;
    return s as GameState;
  } catch { return null; }
}
export function readSave(): GameState {
  try { return decodeSave(localStorage.getItem(SAVE_KEY)) ?? freshGame(); }
  catch { return freshGame(); }
}
export function writeSave(state: GameState): boolean {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
