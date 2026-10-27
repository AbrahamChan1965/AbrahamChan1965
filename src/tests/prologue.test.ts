import { describe, it, expect } from "vitest";
import { freshGame, planRoute, step, EXIT } from "../game/engine";
import {
  freshCampaign,
  campaignStep,
  canContinue,
  replayChapter,
  replayPrologue,
} from "../campaign/state";
import { decodeCampaign, migrateSave } from "../campaign/save";
import { createRoad, roadStep } from "../travel/road";
import { createCoast, coastStep } from "../coast/engine";
import {
  BEREA_MAP,
  ATHENS_MAP,
  createExplorer,
  exploreStep,
  restoreExplorer,
} from "../game/exploration";
import { ORDERS, placePiece, readyToCut } from "../corinth/crafting";
import { campaignPlaythrough, exploreRoute } from "./campaignPlaythrough";
const escaped = () => planRoute(freshGame(), EXIT)!.reduce(step, freshGame());
it("replays the whole prologue with all operations reset while retaining learning memories", () => {
  const end = campaignPlaythrough(escaped()).at(-1)!.after;
  const replayed = replayPrologue(end);
  expect(replayed.chapter).toBe("CH01_MIDNIGHT_ESCAPE");
  expect(replayed.completed).toEqual([]);
  expect(replayed.escape?.status).toBe("playing");
  expect(replayed.road.km).toBe(0);
  expect(replayed.workshop.completedOrders).toEqual([]);
  expect(replayed.letterOpen).toBe(false);
  expect(replayed.memories).toEqual(end.memories);
  expect(replayed.journal).toEqual(end.journal);
});
describe("prologue continuity and save migration", () => {
  it("keeps an existing first-chapter save and completion, with the actual continuation gated", () => {
    const old = escaped(),
      migrated = migrateSave(JSON.stringify(old));
    expect(migrated.escape).toEqual(old);
    expect(migrated.chapter).toBe("CH01_MIDNIGHT_ESCAPE");
    expect(migrated.completed).toContain("CH01_MIDNIGHT_ESCAPE");
    expect(canContinue(migrated)).toBe(true);
    expect(campaignStep(migrated, { type: "continue" }).chapter).toBe(
      "CH02_78KM_ROAD",
    );
    expect(
      campaignStep(freshCampaign(freshGame()), { type: "continue" }).chapter,
    ).toBe("CH01_MIDNIGHT_ESCAPE");
  });
  it("migrates unfinished and corrupt legacy saves without granting completion", () => {
    const old = step(freshGame(), { type: "move", direction: "right" });
    expect(migrateSave(JSON.stringify(old)).escape?.position).toEqual(
      old.position,
    );
    expect(migrateSave("{bad").completed).toEqual([]);
    expect(migrateSave(null).escape).toBeNull();
  });
  it("plays every new chapter through real transitions, and every intermediate save resumes", () => {
    const records = campaignPlaythrough(escaped());
    expect(records.length).toBeGreaterThan(100);
    for (const record of records) {
      const restored = decodeCampaign(JSON.stringify(record.after));
      expect(restored, `${record.after.chapter} ${record.action.type}`).toEqual(
        record.after,
      );
    }
    const final = records.at(-1)!.after;
    expect(final.completed).toHaveLength(7);
    expect(final.letter.dayComplete).toBe(true);
    expect(final.memories).toContain("庇哩亚查考经文");
    expect(final.flags).toContain("companion-help");
    expect(final.workshop.completedOrders).toHaveLength(3);
  });
  it("preserves terminal setbacks and rejects malformed new saves", () => {
    const state = freshCampaign();
    state.chapter = "CH02_78KM_ROAD";
    state.road.food = 0;
    const setback = campaignStep(state, {
      type: "road",
      action: { type: "rest" },
    });
    expect(setback.road.status).toBe("setback");
    expect(decodeCampaign(JSON.stringify(setback))).toEqual(setback);
    for (const raw of [
      "null",
      "{}",
      "{",
      JSON.stringify({ ...freshCampaign(), chapter: "CH99" }),
      JSON.stringify({ ...freshCampaign(), road: {} }),
      JSON.stringify({ ...freshCampaign(), workshop: null }),
    ])
      expect(decodeCampaign(raw)).toBeNull();
  });
  it("replays only reached chapters, retaining memories and the historical first-chapter snapshot", () => {
    const end = campaignPlaythrough(escaped()).at(-1)!.after;
    const replay = replayChapter(end, "CH02_78KM_ROAD");
    expect(replay.road.km).toBe(0);
    expect(replay.memories).toEqual(end.memories);
    expect(replay.escape).toEqual(end.escape);
    expect(replayChapter(freshCampaign(), "CH05_ATHENS").chapter).toBe(
      "CH01_MIDNIGHT_ESCAPE",
    );
  });
});
describe("travel, endurance and companion support", () => {
  it("changes resource and time costs when choosing pace and exposure routes", () => {
    const initial = createRoad();
    const steady = roadStep(initial, { type: "move" }).state;
    const quick = roadStep(
      { ...initial, pace: "quick" },
      { type: "move" },
    ).state;
    const careful = roadStep(
      { ...initial, pace: "careful", route: "sheltered" },
      { type: "move" },
    ).state;
    expect(quick.km).toBeGreaterThan(steady.km);
    expect(quick.fatigue).toBeGreaterThan(steady.fatigue);
    expect(careful.hours).toBeGreaterThan(steady.hours);
    expect(careful.water).toBeLessThan(steady.water);
    expect(careful.fatigue).toBeLessThan(initial.fatigue);
    expect(initial.km).toBe(0);
  });
  it("uses ordinary resources for support, and carries that decision into Berea", () => {
    const support = roadStep(createRoad(), { type: "support" }).state;
    expect(support.water).toBe(9);
    expect(support.supports).toBe(1);
    expect(support.companionFatigue).toBeLessThan(
      createRoad().companionFatigue,
    );
    const state = freshCampaign(escaped());
    state.chapter = "CH02_78KM_ROAD";
    state.road = { ...support, status: "arrived", km: 78 };
    const next = campaignStep(state, { type: "continue" });
    expect(next.berea.explorer.found).toContain("companion");
    state.road.supports = 0;
    expect(
      campaignStep(state, { type: "continue" }).berea.explorer.found,
    ).not.toContain("companion");
  });
  it("recovers from exhaustion with the last full checkpoint, rather than granting progress", () => {
    let r = createRoad();
    r = roadStep(r, { type: "pace", value: "quick" }).state;
    for (let i = 0; i < 12 && r.status === "walking"; i++)
      r = roadStep(r, { type: "move" }).state;
    expect(r.status).toBe("setback");
    const recovered = roadStep(r, { type: "retry" }).state;
    expect(recovered.km).toBe(r.checkpoint.km);
    expect(recovered.companionFatigue).toBe(r.checkpoint.companionFatigue);
    expect(recovered.status).toBe("walking");
  });
  it("does not allow repeated refill farming at the same stage", () => {
    const once = roadStep(createRoad(), { type: "refill" }).state;
    expect(roadStep(once, { type: "refill" }).state).toBe(once);
  });
});
describe("evidence and evacuation", () => {
  it("rejects a false evidence association and switches the completed table to a different playable map", () => {
    let state = freshCampaign();
    state.chapter = "CH03_BEREA_CRISIS";
    state = campaignStep(state, {
      type: "berea-match",
      slot: "suffering",
      card: "resurrection",
    });
    expect(state.berea.matched).toEqual({});
    for (const id of ["suffering", "resurrection", "proclamation"])
      state = campaignStep(state, { type: "berea-match", slot: id, card: id });
    expect(state.berea.phase).toBe("crisis");
    expect(state.log.at(-1)).toContain("西拉和提摩太暂留");
    expect(canContinue(state)).toBe(false);
  });
  it("finds safe paths, detects an actual patrol collision, and restores the last contacted checkpoint", () => {
    let nav = createExplorer(BEREA_MAP);
    for (const action of exploreRoute(
      BEREA_MAP,
      nav,
      BEREA_MAP.places[0].position,
      true,
    ))
      nav = exploreStep(BEREA_MAP, nav, action).state;
    expect(nav.found).toContain("companion");
    const checkpoint = nav.checkpoint;
    const caught = exploreStep(
      BEREA_MAP,
      { ...nav, position: { x: 2, y: 3 }, turn: 0 },
      "right",
    ).state;
    expect(caught.caught).toBe(true);
    expect(restoreExplorer(caught).position).toEqual(checkpoint.position);
    expect(restoreExplorer(caught).found).toContain("companion");
  });
});
describe("uncertain coastal routes", () => {
  it("gates route selection on escort, information and communication", () => {
    expect(
      coastStep(createCoast(), { type: "route", route: "sea" }).state.stage,
    ).toBe("escort");
    let c = createCoast();
    for (let i = 0; i < 4; i++) c = coastStep(c, { type: "approach" }).state;
    expect(
      coastStep(c, { type: "route", route: "sea" }).state.route,
    ).toBeNull();
  });
  it("advances only when the sail matches the visible wind and recovers after failure", () => {
    const state = {
      ...createCoast(),
      stage: "sea" as const,
      route: "sea" as const,
      sail: 0,
    };
    const miss = coastStep(state, { type: "advance" }).state;
    expect(miss.progress).toBe(0);
    expect(miss.water).toBeLessThan(state.water);
    expect(
      coastStep({ ...state, sail: 1 }, { type: "advance" }).state.progress,
    ).toBe(1);
    const failed = coastStep({ ...state, water: 1 }, { type: "advance" }).state;
    expect(failed.setback).toBe(true);
    expect(coastStep(failed, { type: "retry" }).state.setback).toBe(false);
  });
  it("allows both route reconstructions to reach the same canonical city with different costs", () => {
    const sea = campaignPlaythrough(escaped(), true).at(-1)!.after;
    const land = campaignPlaythrough(escaped(), false).at(-1)!.after;
    expect(sea.coast.stage).toBe("arrived");
    expect(land.coast.stage).toBe("arrived");
    expect(land.coast.hours).toBeGreaterThan(sea.coast.hours);
    expect(land.flags).toContain("arrived-by-land-model");
    expect(sea.flags).toContain("arrived-by-sea-model");
  });
});
describe("Athens listening and discussion", () => {
  it("requires actual location investigation and accurate listening before association", () => {
    let nav = createExplorer(ATHENS_MAP);
    for (const place of ATHENS_MAP.places)
      for (const action of exploreRoute(ATHENS_MAP, nav, place.position, true))
        nav = exploreStep(ATHENS_MAP, nav, action).state;
    expect(nav.found).toHaveLength(6);
    let state = freshCampaign();
    state.chapter = "CH05_ATHENS";
    state.athens.phase = "argument";
    state = campaignStep(state, {
      type: "athens-match",
      slot: "divine",
      card: "divine",
    });
    expect(state.athens.matched).toEqual({});
    state = campaignStep(state, {
      type: "understand",
      id: "epicurean",
      interpretation: "insult",
    });
    expect(state.athens.understood).toEqual([]);
    state = campaignStep(state, {
      type: "understand",
      id: "epicurean",
      interpretation: "peace",
    });
    expect(state.athens.understood).toContain("epicurean");
  });
  it("preserves all three canonical types of response rather than awarding a conversion total", () => {
    const end = campaignPlaythrough(escaped()).at(-1)!.after;
    expect(end.athens.responses.sort()).toEqual(["again", "believe", "mock"]);
  });
});
describe("crafting, resources, ordinary life and letter preparation", () => {
  it("rejects out-of-bounds and overlapping layouts, supports rotation, and requires full coverage", () => {
    const order = ORDERS[0];
    expect(
      placePiece(order, [], { id: "a", x: 3, y: 0, rotated: false }),
    ).toBeNull();
    const first = placePiece(order, [], {
      id: "a",
      x: 0,
      y: 0,
      rotated: false,
    })!;
    expect(
      placePiece(order, first, { id: "b", x: 1, y: 1, rotated: false }),
    ).toBeNull();
    expect(readyToCut(order, first)).toBe(false);
    expect(
      placePiece(ORDERS[1], [], { id: "a", x: 0, y: 0, rotated: true }),
    ).not.toBeNull();
  });
  it("spends actual materials and work hours, never delivers unfinished products", () => {
    const records = campaignPlaythrough(escaped());
    const cut = records.find(
      (r) => r.action.type === "work" && r.action.action === "cut",
    )!;
    expect(cut.after.workshop.materials).toBe(
      cut.before.workshop.materials - 12,
    );
    expect(cut.after.workshop.hours).toBe(cut.before.workshop.hours - 2);
    const initial = freshCampaign();
    initial.chapter = "CH06_CORINTH_WORKSHOP";
    const invalid = campaignStep(initial, { type: "work", action: "deliver" });
    expect(invalid.workshop.income).toBe(initial.workshop.income);
    expect(invalid.workshop.completedOrders).toEqual([]);
  });
  it("provides a non-monetized recovery when material and money run out", () => {
    const state = freshCampaign();
    state.chapter = "CH06_CORINTH_WORKSHOP";
    state.workshop.income = 0;
    state.workshop.materials = 0;
    const supported = campaignStep(state, { type: "work", action: "borrow" });
    expect(supported.workshop.materials).toBe(12);
    expect(supported.workshop.hours).toBe(4);
    expect(
      campaignStep(supported, { type: "work", action: "borrow" }).workshop
        .materials,
    ).toBe(12);
  });
  it("opens the report only after work and relationships, then connects memory to the actual letter", () => {
    const records = campaignPlaythrough(escaped());
    const report = records.find(
      (r) => r.action.type === "work" && r.action.action === "report",
    )!;
    expect(report.before.workshop.completedOrders).toHaveLength(3);
    expect(report.after.workshop.phase).toBe("memory");
    expect(report.after.memories).toContain("提摩太带回消息");
    const end = records.at(-1)!.after;
    expect(end.workshop.phase).toBe("done");
    expect(end.letterOpen).toBe(true);
  });
});
describe("formation, transfer and the Living Letter", () => {
  it("checks a sustainable care plan, reliable sources and accurate modern listening", () => {
    let s = freshCampaign();
    s.chapter = "CH02_78KM_ROAD";
    s = campaignStep(s, { type: "modern", action: "check" });
    expect(s.modern[s.chapter]?.complete).toBe(false);
    for (const [slot, value] of [
      ["morning", "helper"],
      ["afternoon", "self"],
      ["evening", "rest"],
    ])
      s = campaignStep(s, { type: "modern", action: "plan", slot, value });
    s = campaignStep(s, { type: "modern", action: "check" });
    expect(s.modern[s.chapter]?.complete).toBe(true);
    s.chapter = "CH03_BEREA_CRISIS";
    for (const value of ["source", "context", "reliable"])
      s = campaignStep(s, { type: "modern", action: "inspect", value });
    s = campaignStep(s, { type: "modern", action: "respond", value: "hold" });
    s = campaignStep(s, { type: "modern", action: "check" });
    expect(s.modern[s.chapter]?.complete).toBe(true);
    s.chapter = "CH05_ATHENS";
    s = campaignStep(s, { type: "modern", action: "inspect", value: "listen" });
    s = campaignStep(s, {
      type: "modern",
      action: "respond",
      value: "dignity",
    });
    s = campaignStep(s, { type: "modern", action: "check" });
    expect(s.modern[s.chapter]?.complete).toBe(true);
  });
  it("requires reception and hearing, then handles capacity without spiritual scoring or repeat farming", () => {
    let s = freshCampaign();
    s.chapter = "EPILOGUE_FIRST_LETTER";
    expect(campaignStep(s, { type: "receive-letter" }).letter.phase).toBe(
      "arrival",
    );
    s = campaignStep(s, { type: "open-letter" });
    s = campaignStep(s, { type: "receive-letter" });
    s = campaignStep(s, { type: "read-letter", page: 0 });
    for (const task of ["work", "food", "visit"])
      s = campaignStep(s, { type: "assign-care", task, person: "artisan" });
    s = campaignStep(s, { type: "care-day" });
    expect(s.letter.dayComplete).toBe(false);
    s = campaignStep(s, { type: "assign-care", task: "food", person: "host" });
    s = campaignStep(s, {
      type: "assign-care",
      task: "visit",
      person: "neighbor",
    });
    s = campaignStep(s, { type: "care-day" });
    expect(s.letter.dayComplete).toBe(true);
    expect(
      campaignStep(s, { type: "assign-care", task: "food", person: "artisan" })
        .letter.assignments.food,
    ).toBe("host");
    expect(JSON.stringify(s)).not.toMatch(
      /faithScore|holinessPoints|HolySpiritPower|divineApproval|spiritualLevel/,
    );
  });
});
