// All geography, patrols and household names below are fictional gameplay reconstruction.
export type Point = { x: number; y: number };
export type Tile = 'wall' | 'street' | 'alley' | 'shelter' | 'house' | 'start' | 'exit';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Action = { type: 'move'; direction: Direction } | { type: 'wait' | 'interact' };
export type Status = 'playing' | 'caught' | 'escaped';
export type Household = 'weaver' | 'baker';
export type Snapshot = { position: Point; turn: number; contacts: Household[] };
export type GameState = Snapshot & {
  version: 1; status: Status; checkpoint: Snapshot; events: string[];
};
export const WIDTH = 8;
export const HEIGHT = 7;
const rows = ['####...E', '#H...#..', '#.##....', '#..SA.#.', '#.#.#.H.', '@...#...', '##......'];
const types: Record<string, Tile> = { '#': 'wall', '.': 'street', A: 'alley', S: 'shelter', H: 'house', '@': 'start', E: 'exit' };
export const MAP: Tile[][] = rows.map(row => [...row].map(c => types[c]));
export const START: Point = { x: 0, y: 5 };
export const EXIT: Point = { x: 7, y: 0 };
export const SHELTER: Point = { x: 3, y: 3 };
export const HOUSEHOLDS: { id: Household; position: Point; name: string; task: string }[] = [
  { id: 'weaver', position: { x: 1, y: 1 }, name: '织工之家', task: '把接济的消息交给织工，她会主动去找烘饼人。' },
  { id: 'baker', position: { x: 6, y: 4 }, name: '烘饼之家', task: '托付明日的探访，让留下来的人接续照顾邻舍。' },
];
export const PATROLS: { name: string; route: Point[] }[] = [
  { name: '西街巡查', route: [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 3, y: 1 }] },
  { name: '东街巡查', route: [{ x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 4 }, { x: 7, y: 3 }] },
];
export const DELTAS: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
export const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export function tileAt(p: Point): Tile { return MAP[p.y]?.[p.x] ?? 'wall'; }
export function patrolAt(index: number, turn: number) {
  const patrol = PATROLS[index];
  const position = patrol.route[turn % patrol.route.length];
  const next = patrol.route[(turn + 1) % patrol.route.length];
  return { ...patrol, position, next, facing: { x: Math.sign(next.x - position.x), y: Math.sign(next.y - position.y) } };
}
export function vision(index: number, turn: number): Point[] {
  const { position, facing } = patrolAt(index, turn);
  const points: Point[] = [];
  for (let i = 1; i <= 3; i++) {
    const p = { x: position.x + facing.x * i, y: position.y + facing.y * i };
    if (tileAt(p) === 'wall') break;
    points.push(p);
  }
  return points;
}
export function detected(position: Point, turn: number): boolean {
  return PATROLS.some((_, i) => {
    const patrol = patrolAt(i, turn);
    if (same(patrol.position, position)) return true;
    if (tileAt(position) === 'shelter') return false;
    if (tileAt(position) === 'alley' && distance(position, patrol.position) > 1) return false;
    return vision(i, turn).some(p => same(p, position));
  });
}
export function freshGame(): GameState {
  const initial: Snapshot = { position: { ...START }, turn: 0, contacts: [] };
  return { ...initial, version: 1, status: 'playing', checkpoint: structuredClone(initial), events: ['夜已深。你受托前往东北接应点；途中可以把照顾邻舍的事交给两户人家。'] };
}
function message(state: GameState, text: string): GameState { return { ...state, events: [...state.events, text].slice(-30) }; }
export function step(state: GameState, action: Action): GameState {
  if (state.status !== 'playing') return state;
  let position = { ...state.position };
  let contacts = [...state.contacts];
  let feedback = '你停下脚步，听巡查的动静。巡查前进一步。';
  let checkpoint = false;
  if (action.type === 'move') {
    const d = DELTAS[action.direction];
    position = { x: position.x + d.x, y: position.y + d.y };
    if (tileAt(position) === 'wall') return message(state, '石墙挡住去路。无效移动不消耗回合。');
    feedback = `你移至 ${String.fromCharCode(65 + position.x)}${position.y + 1}。`;
  } else if (action.type === 'interact') {
    const house = HOUSEHOLDS.find(h => same(h.position, position));
    if (house && !contacts.includes(house.id)) {
      contacts.push(house.id);
      feedback = house.id === 'weaver' ? '你把接济的消息交给织工。她答应与你分别后继续寻找烘饼人。' : '烘饼人接过探访的托付。他会带着食物去看望受惊的邻舍。';
    } else if (tileAt(position) === 'shelter') {
      checkpoint = true;
      feedback = '你在院落留下接应记号。新的重试点已保存；这里遮断巡查视线。';
    } else {
      return message(state, house ? '这户人家已接下托付。可以继续赶路。' : '这里没有可联络的住户。到人家或接应院落后再行动；不消耗回合。');
    }
  }
  let next: GameState = { ...state, position, contacts, turn: state.turn + 1 };
  // Cannot pass through a patrol's present position, even when it moves away this turn.
  const collision = PATROLS.some((_, i) => same(patrolAt(i, state.turn).position, position));
  if (collision || detected(position, next.turn)) {
    next.status = 'caught';
    return message(next, '巡查发现了你。这只是虚构同工的一次失误；从接应点重试，保罗和西拉的经文结局不变。');
  }
  if (checkpoint) next.checkpoint = structuredClone({ position, turn: next.turn, contacts });
  if (same(position, EXIT)) {
    next.status = 'escaped';
    feedback = '你抵达接应点。弟兄们趁夜送保罗和西拉往庇哩亚去。你的视角离开了城，城里的故事却仍在继续。';
  }
  return message(next, feedback);
}
export function recover(state: GameState): GameState {
  return { ...state, ...structuredClone(state.checkpoint), status: 'playing', events: [...state.events, '回到最近接应点。巡查也恢复到该回合的位置，你可以重新规划。'].slice(-30) };
}
export function availableInteraction(state: GameState): string | null {
  const house = HOUSEHOLDS.find(h => same(h.position, state.position));
  if (house) return state.contacts.includes(house.id) ? '已完成托付' : `联络${house.name}`;
  return tileAt(state.position) === 'shelter' ? '留下接应记号' : null;
}
// A route assistant for tests and accessibility: actual engine transitions, never a scripted win.
export function planRoute(state: GameState, target: Point, requireInteraction = false): Action[] | null {
  if (state.status !== 'playing') return null;
  const queue: { state: GameState; actions: Action[] }[] = [{ state, actions: [] }];
  const seen = new Set<string>();
  for (let head = 0; head < queue.length; head++) {
    const item = queue[head];
    const key = `${item.state.position.x},${item.state.position.y},${item.state.turn % 12},${[...item.state.contacts].sort().join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (same(item.state.position, target)) {
      if (!requireInteraction) return item.actions;
      const after = step(item.state, { type: 'interact' });
      if (after.status !== 'caught' && after.turn > item.state.turn) return [...item.actions, { type: 'interact' }];
    }
    for (const action of [...Object.keys(DELTAS).map(direction => ({ type: 'move', direction } as Action)), { type: 'wait' } as Action]) {
      const next = step(item.state, action);
      if (next.status !== 'caught' && next.turn > item.state.turn) queue.push({ state: next, actions: [...item.actions, action] });
    }
  }
  return null;
}
