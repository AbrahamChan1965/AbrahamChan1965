import { describe, it, expect } from 'vitest';
import { MAP, PATROLS, HOUSEHOLDS, EXIT, SHELTER, freshGame, step, recover, detected, vision, tileAt, distance, patrolAt, planRoute, same, type GameState, type Point, type Action } from '../game/engine';
import { decodeSave } from '../game/save';
import { communityOutcome } from '../narrative/content';

function travel(state: GameState, target: Point, interact = false): GameState {
  const route = planRoute(state, target, interact);
  expect(route, `Expected a safe route to ${JSON.stringify(target)}`).not.toBeNull();
  let next = state;
  for (const action of route!) {
    next = step(next, action);
    expect(next.status).not.toBe('caught');
  }
  expect(same(next.position, target)).toBe(true);
  return next;
}
describe('night escape tactical rules', () => {
  it('moves one orthogonal tile, advances both patrols, and leaves the prior state untouched', () => {
    const initial = freshGame();
    const next = step(initial, { type: 'move', direction: 'right' });
    expect(next.position).toEqual({ x: 1, y: 5 });
    expect(next.turn).toBe(1);
    expect(initial.position).toEqual({ x: 0, y: 5 });
    expect(patrolAt(0, next.turn).position).toEqual({ x: 3, y: 1 });
    expect(patrolAt(1, next.turn).position).toEqual({ x: 7, y: 3 });
  });
  it('does not spend turns crossing walls, map edges, or interacting with nothing', () => {
    for (const action of [{ type: 'move', direction: 'left' }, { type: 'move', direction: 'up' }, { type: 'interact' }] as Action[]) {
      const next = step(freshGame(), action);
      expect(next.position).toEqual({ x: 0, y: 5 });
      expect(next.turn).toBe(0);
    }
  });
  it('has contiguous non-wall patrol routes, repeats deterministically, and exposes a complete forecast', () => {
    expect(MAP).toHaveLength(7);
    expect(MAP.every(row => row.length === 8)).toBe(true);
    PATROLS.forEach((patrol, i) => patrol.route.forEach((p, t) => {
      expect(tileAt(p)).not.toBe('wall');
      expect(distance(p, patrolAt(i, t).next)).toBe(1);
      expect(patrolAt(i, t).position).toEqual(patrolAt(i, t + 12).position);
      expect(patrolAt(i, t).next).toEqual(patrolAt(i, t + 1).position);
    }));
  });
  it('waits without moving while the threat changes', () => {
    const next = step(freshGame(), { type: 'wait' });
    expect(next.position).toEqual(freshGame().position);
    expect(next.turn).toBe(1);
  });
  it('detects the forward line, not behind, and stops at walls', () => {
    expect(detected({ x: 7, y: 6 }, 1)).toBe(true);
    expect(detected({ x: 7, y: 2 }, 1)).toBe(false);
    expect(vision(0, 0)).toEqual([{ x: 3, y: 1 }, { x: 4, y: 1 }]);
  });
  it('conceals in a courtyard and conceals a distant alley without granting invulnerability', () => {
    expect(vision(0, 5)).toContainEqual(SHELTER);
    expect(detected(SHELTER, 5)).toBe(false);
    expect(detected({ x: 2, y: 3 }, 5)).toBe(true);
    expect(vision(0, 2)).toContainEqual({ x: 4, y: 3 });
    expect(detected({ x: 4, y: 3 }, 2)).toBe(false);
    expect(detected({ x: 4, y: 3 }, 5)).toBe(true);
    expect(detected({ x: 4, y: 3 }, 6)).toBe(true);
  });
  it('captures after patrol movement, freezes actions, and recovers the entire checkpoint', () => {
    const checkpointState = travel(freshGame(), SHELTER, true);
    const risky = { ...checkpointState, position: { x: 6, y: 4 }, turn: 1 + 12 * Math.ceil(checkpointState.turn / 12) };
    const caught = step(risky, { type: 'move', direction: 'right' });
    expect(caught.status).toBe('caught');
    expect(step(caught, { type: 'wait' })).toBe(caught);
    const resumed = recover(caught);
    expect(resumed.position).toEqual(checkpointState.position);
    expect(resumed.turn).toBe(checkpointState.turn);
    expect(resumed.contacts).toEqual(checkpointState.contacts);
    expect(resumed.status).toBe('playing');
  });
  it('cannot walk into the patrol position that is being vacated', () => {
    const state = { ...freshGame(), position: { x: 2, y: 1 }, turn: 0 };
    const next = step(state, { type: 'move', direction: 'right' });
    // D2 is the patrol's destination; C2 below tests its original position.
    expect(next.status).toBe('caught');
    const collision = step({ ...freshGame(), position: { x: 1, y: 1 } }, { type: 'move', direction: 'right' });
    expect(collision.status).toBe('caught');
  });
  it('completes both household missions and reaches the canonical rendezvous through actual actions', () => {
    let state = freshGame();
    state = travel(state, HOUSEHOLDS[0].position, true);
    expect(state.contacts).toEqual(['weaver']);
    const duplicate = step(state, { type: 'interact' });
    expect(duplicate.turn).toBe(state.turn);
    state = travel(state, SHELTER, true);
    expect(state.checkpoint.contacts).toEqual(['weaver']);
    state = travel(state, HOUSEHOLDS[1].position, true);
    expect(state.contacts).toEqual(['weaver', 'baker']);
    state = travel(state, EXIT);
    expect(state.status).toBe('escaped');
    expect(state.events.at(-1)).toContain('保罗和西拉往庇哩亚');
    expect(communityOutcome(state.contacts).title).toContain('彼此寻找');
  });
  it('allows departure without optional contacts, rather than making the church depend on the player', () => {
    const escaped = travel(freshGame(), EXIT);
    expect(escaped.status).toBe('escaped');
    expect(escaped.contacts).toEqual([]);
    expect(communityOutcome([]).lines.join('')).toContain('不等于教会失败');
    expect(communityOutcome(['baker']).lines.join('')).toContain('烘饼人');
    expect(communityOutcome(['weaver']).lines.join('')).toContain('织工');
  });
});
describe('save and resume', () => {
  it('round-trips a real progressed checkpoint and resumes the identical patrol and narrative state', () => {
    const progressed = travel(travel(freshGame(), HOUSEHOLDS[0].position, true), SHELTER, true);
    const loaded = decodeSave(JSON.stringify(progressed));
    expect(loaded).toEqual(progressed);
    expect(step(loaded!, { type: 'wait' })).toEqual(step(progressed, { type: 'wait' }));
  });
  it('preserves terminal escape and capture states', () => {
    const escaped = travel(freshGame(), EXIT);
    expect(decodeSave(JSON.stringify(escaped))?.status).toBe('escaped');
    const caught = step({ ...freshGame(), position: { x: 1, y: 1 } }, { type: 'move', direction: 'right' });
    expect(decodeSave(JSON.stringify(caught))?.status).toBe('caught');
  });
  it('rejects malformed, incompatible and invalid-location saves safely', () => {
    for (const value of [null, '{', 'null', '[]', '{}', JSON.stringify({ ...freshGame(), version: 2 }), JSON.stringify({ ...freshGame(), position: { x: 0, y: 0 } }), JSON.stringify({ ...freshGame(), checkpoint: { ...freshGame().checkpoint, turn: -1 } }), JSON.stringify({ ...freshGame(), contacts: ['grace-points'] })]) {
      expect(decodeSave(value)).toBeNull();
    }
  });
});
