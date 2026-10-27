import {
  campaignStep,
  freshCampaign,
  type Campaign,
  type CampaignAction,
} from "../campaign/state";
import {
  BEREA_MAP,
  ATHENS_MAP,
  exploreStep,
  type ExploreMap,
  type ExploreState,
} from "../game/exploration";
import {
  same,
  type Point,
  type GameState,
  type Direction,
} from "../game/engine";
import { roadStage } from "../travel/road";
import { WINDS } from "../coast/engine";
import { ORDERS } from "../corinth/crafting";
import { BEREA_SLOTS, ATHENS_SLOTS, MEMORY_SLOTS } from "../campaign/content";
type WalkAction = Direction | "wait" | "interact";
export function exploreRoute(
  map: ExploreMap,
  state: ExploreState,
  target: Point,
  interact = false,
): WalkAction[] {
  const queue: { state: ExploreState; path: WalkAction[] }[] = [
      { state, path: [] },
    ],
    seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i],
      key = `${item.state.position.x},${item.state.position.y},${item.state.turn % (map.patrol?.length ?? 1)},${item.state.found.join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (same(item.state.position, target)) {
      if (!interact) return item.path;
      const result = exploreStep(map, item.state, "interact");
      if (
        !result.state.caught &&
        result.state.found.length > item.state.found.length
      )
        return [...item.path, "interact"];
    }
    for (const action of [
      "up",
      "right",
      "down",
      "left",
      "wait",
    ] as WalkAction[]) {
      const next = exploreStep(map, item.state, action).state;
      if (!next.caught && next.turn > item.state.turn)
        queue.push({ state: next, path: [...item.path, action] });
    }
  }
  throw new Error(`No safe exploration route to ${JSON.stringify(target)}`);
}
export type StepRecord = {
  before: Campaign;
  action: CampaignAction;
  after: Campaign;
};
export function campaignPlaythrough(
  escape: GameState,
  sea = true,
): StepRecord[] {
  let state = freshCampaign(escape);
  const records: StepRecord[] = [];
  const act = (action: CampaignAction) => {
    const before = state;
    state = campaignStep(state, action);
    records.push({ before, action, after: state });
  };
  act({ type: "continue" });
  for (let i = 0; state.road.status === "walking" && i < 150; i++) {
    const r = state.road,
      stage = roadStage(r);
    if (!r.clues.includes(stage))
      act({ type: "road", action: { type: "investigate" } });
    else if (r.water < 6 && !r.refilled.includes(stage))
      act({ type: "road", action: { type: "refill" } });
    else if (!r.supports && r.km >= 12)
      act({ type: "road", action: { type: "support" } });
    else if (r.fatigue > 42 || r.companionFatigue > 60)
      act({ type: "road", action: { type: "rest" } });
    else act({ type: "road", action: { type: "move" } });
  }
  if (state.road.status !== "arrived")
    throw new Error(`Road did not finish: ${JSON.stringify(state.road)}`);
  act({ type: "continue" });
  for (const slot of BEREA_SLOTS)
    act({ type: "berea-match", slot: slot.id, card: slot.id });
  for (const place of BEREA_MAP.places) {
    if (state.berea.explorer.found.includes(place.id)) continue;
    for (const action of exploreRoute(
      BEREA_MAP,
      state.berea.explorer,
      place.position,
      true,
    ))
      act({ type: "explore", action });
  }
  for (const action of exploreRoute(
    BEREA_MAP,
    state.berea.explorer,
    BEREA_MAP.exit!,
  ))
    act({ type: "explore", action });
  if (state.berea.phase !== "departed") throw new Error("Berea did not finish");
  act({ type: "continue" });
  while (state.coast.stage === "escort")
    act({
      type: "coast",
      action: { type: state.coast.fatigue > 65 ? "rest" : "approach" },
    });
  act({ type: "coast", action: { type: "info", id: "transport" } });
  act({ type: "coast", action: { type: "info", id: "weather" } });
  act({ type: "coast", action: { type: "send" } });
  act({
    type: "coast",
    action: { type: "route", route: sea ? "sea" : "land" },
  });
  for (let i = 0; state.coast.stage !== "arrived" && i < 30; i++) {
    if (state.coast.fatigue > 60 || state.coast.water < 3)
      act({ type: "coast", action: { type: "rest" } });
    else {
      if (sea)
        act({
          type: "coast",
          action: { type: "sail", value: WINDS[state.coast.progress] },
        });
      act({ type: "coast", action: { type: "advance" } });
    }
    if (state.coast.setback) throw new Error("Coast route unexpectedly failed");
  }
  act({ type: "continue" });
  for (const place of ATHENS_MAP.places)
    for (const action of exploreRoute(
      ATHENS_MAP,
      state.athens.explorer,
      place.position,
      true,
    ))
      act({ type: "explore", action });
  for (const [id, interpretation] of [
    ["epicurean", "peace"],
    ["stoic", "order"],
    ["seeker", "meaning"],
  ])
    act({ type: "understand", id, interpretation });
  for (const slot of ATHENS_SLOTS)
    act({ type: "athens-match", slot: slot.id, card: slot.id });
  for (const id of ["mock", "again", "believe"]) act({ type: "response", id });
  act({ type: "continue" });
  const work = (
    action:
      | "cut"
      | "stitch"
      | "deliver"
      | "buy"
      | "borrow"
      | "rest"
      | "gather"
      | "care",
    encounter?: string,
  ) => act({ type: "work", action, encounter });
  const ensure = (hours: number, fine = false) => {
    let safety = 0;
    while (
      (state.workshop.hours < hours ||
        (fine && state.workshop.fatigue >= 75)) &&
      safety++ < 5
    )
      work("rest");
  };
  const solutions = [
    [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 2, y: 0 },
      { id: "c", x: 0, y: 2 },
    ],
    [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 3, y: 0 },
      { id: "c", x: 0, y: 2 },
      { id: "d", x: 0, y: 3 },
    ],
    [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 2, y: 0 },
      { id: "c", x: 4, y: 0 },
      { id: "d", x: 0, y: 3 },
    ],
  ];
  for (const [i, order] of ORDERS.entries()) {
    while (state.workshop.materials < order.cols * order.rows) {
      const action = state.workshop.income >= 3 ? "buy" : "borrow";
      ensure(action === "buy" ? 1 : 2);
      work(action);
    }
    for (const p of solutions[i])
      act({ type: "place", placement: { ...p, rotated: false } });
    ensure(2, true);
    work("cut");
    ensure(2, true);
    work("stitch");
    ensure(1);
    work("deliver");
  }
  for (const [action, encounter] of [
    ["gather", undefined],
    ["care", "Justus"],
    ["care", "Crispus"],
  ] as const) {
    ensure(1);
    work(action, encounter);
  }
  if (state.workshop.phase !== "report")
    throw new Error(
      `Workshop did not reach report: ${JSON.stringify(state.workshop)}`,
    );
  act({ type: "work", action: "report" });
  for (const slot of MEMORY_SLOTS)
    act({ type: "memory-match", slot: slot.id, card: slot.id });
  act({ type: "continue" });
  act({ type: "open-letter" });
  act({ type: "receive-letter" });
  act({ type: "read-letter", page: 0 });
  for (const [task, person] of [
    ["work", "artisan"],
    ["food", "host"],
    ["visit", "neighbor"],
  ])
    act({ type: "assign-care", task, person });
  act({ type: "care-day" });
  if (!state.letter.dayComplete)
    throw new Error("Living Letter care plan did not finish");
  return records;
}
