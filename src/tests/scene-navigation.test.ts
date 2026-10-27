import { describe, expect, it } from "vitest";
import { campaignStep, freshCampaign, visitChapter } from "../campaign/state";
import { CHAPTERS } from "../campaign/content";
import { decodeCampaign } from "../campaign/save";
import { freshGame, step } from "../game/engine";
import { sceneGoal } from "../campaign/SceneNavigation";

describe("free scene navigation", () => {
  it("opens every scene immediately, preserving unfinished goals rather than marking them complete", () => {
    let state = freshCampaign();
    for (const chapter of CHAPTERS) {
      state = visitChapter(state, chapter.id);
      expect(state.chapter).toBe(chapter.id);
      expect(state.completed).toEqual([]);
      expect(sceneGoal(state).length).toBeGreaterThan(10);
      expect(decodeCampaign(JSON.stringify(state))).toEqual(state);
    }
  });
  it("keeps partial road and workshop work when moving ahead and coming back", () => {
    let state = visitChapter(freshCampaign(), "CH02_78KM_ROAD");
    state = campaignStep(state, { type: "road", action: { type: "move" } });
    const road = structuredClone(state.road);
    state = visitChapter(state, "CH06_CORINTH_WORKSHOP");
    state = campaignStep(state, {
      type: "place",
      placement: { id: "a", x: 0, y: 0, rotated: false },
    });
    const workshop = structuredClone(state.workshop);
    state = visitChapter(state, "CH02_78KM_ROAD");
    expect(state.road).toEqual(road);
    state = visitChapter(state, "CH06_CORINTH_WORKSHOP");
    expect(state.workshop).toEqual(workshop);
    expect(state.completed).toEqual([]);
  });
  it("allows departure from a caught or exhausted game and retains its recovery state", () => {
    let state = freshCampaign(
      step(
        { ...freshGame(), position: { x: 1, y: 1 } },
        { type: "move", direction: "right" },
      ),
    );
    expect(state.escape?.status).toBe("caught");
    state = visitChapter(state, "CH02_78KM_ROAD");
    state.road.status = "setback";
    const saved = structuredClone(state.road);
    state = visitChapter(state, "CH05_ATHENS");
    state = visitChapter(state, "CH02_78KM_ROAD");
    expect(state.road).toEqual(saved);
    expect(state.escape?.status).toBe("caught");
  });
  it("records an actually finished goal while leaving, without resetting a previously explored destination", () => {
    let state = visitChapter(freshCampaign(), "CH04_COASTAL_EVACUATION");
    state = campaignStep(state, {
      type: "coast",
      action: { type: "approach" },
    });
    const coast = structuredClone(state.coast);
    state = visitChapter(state, "CH03_BEREA_CRISIS");
    state.berea.phase = "departed";
    state = campaignStep(state, { type: "continue" });
    expect(state.coast).toEqual(coast);
    expect(state.completed).toEqual(["CH03_BEREA_CRISIS"]);
  });
  it("does not declare the full prologue complete after freely visiting only the workshop", () => {
    let state = visitChapter(freshCampaign(), "CH06_CORINTH_WORKSHOP");
    state.workshop.phase = "done";
    state = campaignStep(state, { type: "continue" });
    expect(state.chapter).toBe("EPILOGUE_FIRST_LETTER");
    expect(state.completed).toEqual(["CH06_CORINTH_WORKSHOP"]);
  });
});
