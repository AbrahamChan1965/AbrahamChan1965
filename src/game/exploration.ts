import { DELTAS, same, distance, type Point, type Direction } from "./engine";
export type Place = { id: string; name: string; position: Point; text: string };
export type ExploreMap = {
  rows: string[];
  start: Point;
  exit?: Point;
  places: Place[];
  patrol?: Point[];
};
export type ExploreSnapshot = {
  position: Point;
  turn: number;
  found: string[];
};
export type ExploreState = ExploreSnapshot & {
  caught: boolean;
  checkpoint: ExploreSnapshot;
};
export function createExplorer(map: ExploreMap): ExploreState {
  const initial = {
    position: { ...map.start },
    turn: 0,
    found: [] as string[],
  };
  return { ...initial, caught: false, checkpoint: structuredClone(initial) };
}
export function explorerGuard(map: ExploreMap, turn: number) {
  return map.patrol?.[turn % map.patrol.length];
}
export function explorerSight(map: ExploreMap, turn: number): Point[] {
  if (!map.patrol) return [];
  const current = explorerGuard(map, turn)!;
  const next = explorerGuard(map, turn + 1)!;
  const dx = Math.sign(next.x - current.x),
    dy = Math.sign(next.y - current.y);
  const result: Point[] = [];
  for (let i = 1; i <= 2; i++) {
    const p = { x: current.x + dx * i, y: current.y + dy * i };
    if (!walkable(map, p)) break;
    result.push(p);
  }
  return result;
}
export function walkable(map: ExploreMap, p: Point) {
  return !!map.rows[p.y]?.[p.x] && map.rows[p.y][p.x] !== "#";
}
export function exploreStep(
  map: ExploreMap,
  state: ExploreState,
  action: Direction | "wait" | "interact",
): { state: ExploreState; message: string } {
  if (state.caught) return { state, message: "请从最近集合点重试。" };
  let position = { ...state.position };
  let found = [...state.found];
  let message = "你等候了一回合。";
  if (action === "interact") {
    const place = map.places.find((p) => same(p.position, position));
    if (!place) return { state, message: "先走到标记地点，再调查或联络。" };
    if (found.includes(place.id))
      return { state, message: "这处信息已经记录在手记中。" };
    found.push(place.id);
    message = place.text;
  } else if (action !== "wait") {
    const delta = DELTAS[action];
    position = { x: position.x + delta.x, y: position.y + delta.y };
    if (!walkable(map, position))
      return { state, message: "这里不能通行；无效移动不消耗回合。" };
    message = `走到 ${String.fromCharCode(65 + position.x)}${position.y + 1}。`;
  }
  const next: ExploreState = {
    ...state,
    position,
    found,
    turn: state.turn + 1,
  };
  const guard = explorerGuard(map, next.turn);
  const before = explorerGuard(map, state.turn);
  const shelter = map.rows[position.y][position.x] === "S";
  if (
    (before && same(before, position)) ||
    (guard && same(guard, position)) ||
    (!shelter && explorerSight(map, next.turn).some((p) => same(p, position)))
  ) {
    next.caught = true;
    return {
      state: next,
      message:
        "虚构护送任务受阻。回到最近集合点，换一种走法；经文人物的结局不变。",
    };
  }
  if (action === "interact" && map.patrol)
    next.checkpoint = structuredClone({ position, turn: next.turn, found });
  return { state: next, message };
}
export function restoreExplorer(state: ExploreState): ExploreState {
  return { ...state, ...structuredClone(state.checkpoint), caught: false };
}
export function directionTo(a: Point, b: Point): Direction | null {
  if (distance(a, b) !== 1) return null;
  return b.x > a.x ? "right" : b.x < a.x ? "left" : b.y > a.y ? "down" : "up";
}
export const BEREA_MAP: ExploreMap = {
  rows: ["..#..E", ".#....", "S..#..", "......", "S.#..."],
  start: { x: 0, y: 4 },
  exit: { x: 5, y: 0 },
  patrol: [
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 5, y: 3 },
    { x: 4, y: 3 },
  ],
  places: [
    {
      id: "companion",
      name: "护送同伴",
      position: { x: 1, y: 3 },
      text: "你找到护送同伴并确认集合地点。虚构任务接应点已保存；西拉和提摩太仍留在庇哩亚。",
    },
    {
      id: "coast-note",
      name: "道路消息",
      position: { x: 4, y: 1 },
      text: "你取得前往海边的道路消息。它是游戏用的路线重建，不是古代地图的实物复原。",
    },
  ],
};
export const ATHENS_MAP: ExploreMap = {
  rows: [".......", "..#.#..", ".......", ".#..#..", "......."],
  start: { x: 0, y: 4 },
  places: [
    {
      id: "divine",
      name: "祭坛",
      position: { x: 1, y: 1 },
      text: "祭坛意象使你想到徒17:23：保罗从观察进入交流。具体位置与造型为创作重建。",
    },
    {
      id: "life",
      name: "市场",
      position: { x: 5, y: 1 },
      text: "你在市场听见对生命与供奉的提问。把问题记下，与徒17:24–25对照。",
    },
    {
      id: "near",
      name: "诗人角",
      position: { x: 2, y: 3 },
      text: "诗人的语言成为交流桥梁。参徒17:27–29；这里的街角和听者是虚构的。",
    },
    {
      id: "repent",
      name: "会谈处",
      position: { x: 5, y: 3 },
      text: "保罗的信息包含悔改。你记下这个问题，准备在论证板上连接徒17:30。",
    },
    {
      id: "judgment",
      name: "讨论桌",
      position: { x: 3, y: 0 },
      text: "你整理公义与审判的提问。亚略巴古的见证指向神的公义，参徒17:31。",
    },
    {
      id: "raised",
      name: "约见处",
      position: { x: 6, y: 4 },
      text: "复活的见证引起不同回应。记下问题，保留继续交流的空间。参徒17:31–34。",
    },
  ],
};
