import { freshGame, type GameState, type Direction } from "../game/engine";
import {
  BEREA_MAP,
  ATHENS_MAP,
  createExplorer,
  exploreStep,
  restoreExplorer,
  type ExploreState,
} from "../game/exploration";
import {
  createRoad,
  roadStep,
  type RoadAction,
  type RoadState,
} from "../travel/road";
import {
  createCoast,
  coastStep,
  type CoastAction,
  type CoastState,
} from "../coast/engine";
import {
  ORDERS,
  placePiece,
  readyToCut,
  type Placement,
} from "../corinth/crafting";
import {
  CHAPTERS,
  BEREA_CARDS,
  ATHENS_CARDS,
  MEMORIES,
  type ChapterId,
} from "./content";

export type MatchBoard = Record<string, string>;
export type Workshop = {
  phase: "craft" | "report" | "memory" | "done";
  order: number;
  placements: Placement[];
  stage: "layout" | "cut" | "stitched";
  materials: number;
  income: number;
  hours: number;
  day: number;
  fatigue: number;
  needsPaid: number;
  completedOrders: string[];
  encounters: string[];
  memories: MatchBoard;
  schedule: string[];
};
export type ModernState = {
  plan: Record<string, string>;
  inspected: string[];
  response: string;
  complete: boolean;
};
export type LetterState = {
  phase: "arrival" | "reading" | "community";
  heard: number[];
  page: number;
  assignments: Record<string, string>;
  dayComplete: boolean;
};
export type Campaign = {
  version: 3;
  chapter: ChapterId;
  completed: ChapterId[];
  escape: GameState | null;
  road: RoadState;
  berea: {
    phase: "table" | "crisis" | "departed";
    matched: MatchBoard;
    explorer: ExploreState;
  };
  coast: CoastState;
  athens: {
    phase: "explore" | "argument" | "responses";
    explorer: ExploreState;
    understood: string[];
    matched: MatchBoard;
    responses: string[];
  };
  workshop: Workshop;
  modern: Partial<Record<ChapterId, ModernState>>;
  letterOpen: boolean;
  letter: LetterState;
  journal: string[];
  memories: string[];
  flags: string[];
  log: string[];
  revision: number;
};
export function createWorkshop(): Workshop {
  return {
    phase: "craft",
    order: 0,
    placements: [],
    stage: "layout",
    materials: 30,
    income: 4,
    hours: 6,
    day: 1,
    fatigue: 0,
    needsPaid: 0,
    completedOrders: [],
    encounters: ["Aquila", "Priscilla"],
    memories: {},
    schedule: [],
  };
}
export function freshCampaign(escape: GameState | null = null): Campaign {
  return {
    version: 3,
    chapter: "CH01_MIDNIGHT_ESCAPE",
    completed: escape?.status === "escaped" ? ["CH01_MIDNIGHT_ESCAPE"] : [],
    escape,
    road: createRoad(),
    berea: { phase: "table", matched: {}, explorer: createExplorer(BEREA_MAP) },
    coast: createCoast(),
    athens: {
      phase: "explore",
      explorer: createExplorer(ATHENS_MAP),
      understood: [],
      matched: {},
      responses: [],
    },
    workshop: createWorkshop(),
    modern: {},
    letterOpen: false,
    letter: {
      phase: "arrival",
      heard: [],
      page: 0,
      assignments: {},
      dayComplete: false,
    },
    journal: ["徒 17:5–10"],
    memories: [],
    flags: [],
    log: ["前传：从午夜逃亡到第一封信。"],
    revision: 0,
  };
}
export type CampaignAction =
  | { type: "escape"; state: GameState }
  | { type: "continue" }
  | { type: "visit"; chapter: ChapterId }
  | { type: "road"; action: RoadAction }
  | {
      type: "berea-match" | "athens-match" | "memory-match";
      slot: string;
      card: string;
    }
  | { type: "explore"; action: Direction | "wait" | "interact" }
  | { type: "explore-retry" }
  | { type: "coast"; action: CoastAction }
  | { type: "understand"; id: string; interpretation: string }
  | { type: "response"; id: string }
  | { type: "place"; placement: Placement }
  | { type: "remove-piece"; id: string }
  | {
      type: "work";
      action:
        | "cut"
        | "stitch"
        | "deliver"
        | "buy"
        | "borrow"
        | "rest"
        | "meal"
        | "care"
        | "gather"
        | "report";
      encounter?: string;
    }
  | {
      type: "modern";
      action: "plan" | "inspect" | "respond" | "check";
      slot?: string;
      value?: string;
    }
  | { type: "open-letter" | "receive-letter" }
  | { type: "read-letter"; page: number }
  | { type: "assign-care"; task: string; person: string }
  | { type: "care-day" };
export const CARE_TASKS = [
  { id: "work", title: "给受压手艺人安排合作工作", hours: 2 },
  { id: "food", title: "为需要的家庭送晚饭", hours: 1 },
  { id: "visit", title: "陪伴悲伤的邻舍", hours: 2 },
];
export const CARE_PEOPLE = [
  { id: "artisan", name: "手艺人", hours: 2 },
  { id: "neighbor", name: "邻舍", hours: 2 },
  { id: "host", name: "接待者", hours: 1 },
];
const listAdd = <T>(list: T[], item: T) => {
  if (!list.includes(item)) list.push(item);
};
function tell(state: Campaign, text: string): Campaign {
  state.log = [...state.log, text].slice(-50);
  state.revision++;
  return state;
}
export function captureEscape(state: Campaign, escape: GameState): Campaign {
  const next = structuredClone(state);
  next.escape = escape;
  if (escape.status === "escaped") {
    listAdd(next.completed, "CH01_MIDNIGHT_ESCAPE");
    listAdd(next.memories, "午夜逃亡");
  }
  return next;
}
export function canContinue(s: Campaign): boolean {
  switch (s.chapter) {
    case "CH01_MIDNIGHT_ESCAPE":
      return s.escape?.status === "escaped";
    case "CH02_78KM_ROAD":
      return s.road.status === "arrived";
    case "CH03_BEREA_CRISIS":
      return s.berea.phase === "departed";
    case "CH04_COASTAL_EVACUATION":
      return s.coast.stage === "arrived" && !s.coast.setback;
    case "CH05_ATHENS":
      return s.athens.phase === "responses" && s.athens.responses.length === 3;
    case "CH06_CORINTH_WORKSHOP":
      return s.workshop.phase === "done";
    case "EPILOGUE_FIRST_LETTER":
      return false;
  }
}
function enterScene(s: Campaign, chapter: ChapterId) {
  const firstVisit = !s.flags.includes(`visited:${chapter}`);
  s.chapter = chapter;
  if (
    firstVisit &&
    chapter === "CH03_BEREA_CRISIS" &&
    s.berea.phase === "table" &&
    s.berea.explorer.turn === 0 &&
    s.road.supports > 0
  ) {
    listAdd(s.berea.explorer.found, "companion");
    listAdd(s.berea.explorer.checkpoint.found, "companion");
    listAdd(s.flags, "companion-help");
  }
  if (
    firstVisit &&
    chapter === "CH04_COASTAL_EVACUATION" &&
    s.coast.approach === 0 &&
    s.coast.hours === 0
  )
    s.coast = createCoast(Math.floor(s.road.fatigue / 3));
  if (
    firstVisit &&
    chapter === "CH06_CORINTH_WORKSHOP" &&
    s.workshop.day === 1 &&
    s.workshop.order === 0 &&
    s.workshop.hours === 6 &&
    s.workshop.placements.length === 0
  ) {
    s.workshop.fatigue = Math.floor(s.coast.fatigue / 3);
    if (s.coast.route)
      listAdd(
        s.flags,
        s.coast.route === "sea"
          ? "arrived-by-sea-model"
          : "arrived-by-land-model",
      );
  }
  listAdd(s.flags, `visited:${chapter}`);
}
export function visitChapter(state: Campaign, chapter: ChapterId): Campaign {
  if (!CHAPTERS.some((c) => c.id === chapter)) return state;
  const s = structuredClone(state);
  const previous = s.chapter;
  if (canContinue(s)) {
    const info = CHAPTERS.find((c) => c.id === previous)!;
    listAdd(s.completed, previous);
    listAdd(s.memories, info.title);
    listAdd(s.journal, info.ref);
  }
  enterScene(s, chapter);
  return tell(
    s,
    `已保存${CHAPTERS.find((c) => c.id === previous)!.title}的当前进度，进入${CHAPTERS.find((c) => c.id === chapter)!.title}。未完成的目标不会自动记为通关，随时可以回来继续。`,
  );
}
export function campaignStep(
  state: Campaign,
  action: CampaignAction,
): Campaign {
  if (action.type === "escape") return captureEscape(state, action.state);
  if (action.type === "visit") return visitChapter(state, action.chapter);
  const s = structuredClone(state);
  if (action.type === "continue") {
    if (!canContinue(s))
      return tell(s, "先完成当前场景的实际任务；进度仍然保留。");
    const index = CHAPTERS.findIndex((c) => c.id === s.chapter);
    listAdd(s.completed, s.chapter);
    listAdd(s.memories, CHAPTERS[index].title);
    listAdd(s.journal, CHAPTERS[index].ref);
    enterScene(s, CHAPTERS[index + 1].id);
    if (
      s.chapter === "EPILOGUE_FIRST_LETTER" &&
      CHAPTERS.slice(0, 6).every((c) => s.completed.includes(c.id))
    )
      listAdd(s.completed, "EPILOGUE_FIRST_LETTER");
    return tell(
      s,
      `进入${CHAPTERS[index + 1].title}。${s.chapter === "CH03_BEREA_CRISIS" && s.road.supports ? "路上受过扶持的虚构同伴已提前确认接应；这份照顾改变了下一幕的条件。" : ""}`,
    );
  }
  if (action.type === "modern") {
    const modern: ModernState = s.modern[s.chapter] ?? {
      plan: {},
      inspected: [],
      response: "",
      complete: false,
    };
    s.modern[s.chapter] = modern;
    if (action.action === "plan" && action.slot && action.value)
      modern.plan[action.slot] = action.value;
    if (action.action === "inspect" && action.value)
      listAdd(modern.inspected, action.value);
    if (action.action === "respond" && action.value)
      modern.response = action.value;
    if (action.action === "check") {
      const index = CHAPTERS.findIndex((c) => c.id === s.chapter);
      if (index === 2 || index === 3)
        modern.complete =
          modern.inspected.length === 3 && modern.response === "hold";
      else if (index === 4)
        modern.complete =
          modern.inspected.includes("listen") && modern.response === "dignity";
      else
        modern.complete =
          modern.plan.morning === "helper" &&
          modern.plan.afternoon === "self" &&
          modern.plan.evening === "rest";
      return tell(
        s,
        modern.complete
          ? "现代情境已形成可行安排。这里检验的是计划、资料与理解，不衡量灵命。"
          : "还缺少资料或可持续的安排。可以继续调整，没有属灵评分。",
      );
    }
    return tell(
      s,
      "现代情境中的安排已保存在本机。古今处境不同，这是一项迁移练习。",
    );
  }
  if (action.type === "road" && s.chapter === "CH02_78KM_ROAD") {
    const result = roadStep(s.road, action.action);
    s.road = result.state;
    return tell(s, result.message);
  }
  if (
    action.type === "berea-match" &&
    s.chapter === "CH03_BEREA_CRISIS" &&
    s.berea.phase === "table"
  ) {
    if (
      action.slot !== action.card ||
      !BEREA_CARDS.some((c) => c.id === action.card)
    )
      return tell(
        s,
        "这个关联尚不成立。打开出处与上下文，重新比较；书卷不是开门密码。",
      );
    s.berea.matched[action.slot] = action.card;
    listAdd(s.journal, BEREA_CARDS.find((c) => c.id === action.card)!.ref);
    if (Object.keys(s.berea.matched).length === 3) {
      s.berea.phase = "crisis";
      listAdd(s.memories, "庇哩亚查考经文");
      return tell(
        s,
        "查验记录已保存。消息突然传来：部分反对者来到庇哩亚，搅扰再起。护送保罗离开；西拉和提摩太暂留。",
      );
    }
    return tell(s, BEREA_CARDS.find((c) => c.id === action.card)!.explanation);
  }
  if (
    action.type === "explore" &&
    ((s.chapter === "CH03_BEREA_CRISIS" && s.berea.phase === "crisis") ||
      (s.chapter === "CH05_ATHENS" && s.athens.phase === "explore"))
  ) {
    const berea = s.chapter === "CH03_BEREA_CRISIS",
      map = berea ? BEREA_MAP : ATHENS_MAP;
    const result = exploreStep(
      map,
      berea ? s.berea.explorer : s.athens.explorer,
      action.action,
    );
    if (berea) {
      s.berea.explorer = result.state;
      if (
        !result.state.caught &&
        result.state.found.length === 2 &&
        result.state.position.x === 5 &&
        result.state.position.y === 0
      ) {
        s.berea.phase = "departed";
        listAdd(s.flags, "silas-timothy-remain");
        return tell(
          s,
          "护送接续：保罗离开庇哩亚，西拉和提摩太仍留在那里。你的任务没有替他们改变决定。",
        );
      }
    } else {
      s.athens.explorer = result.state;
      if (result.state.found.length === 6) {
        s.athens.phase = "argument";
        return tell(
          s,
          "六处观察已记下。先准确复述三位虚构听者的问题，再整理保罗见证的论证图。",
        );
      }
    }
    return tell(s, result.message);
  }
  if (action.type === "explore-retry" && s.chapter === "CH03_BEREA_CRISIS") {
    s.berea.explorer = restoreExplorer(s.berea.explorer);
    return tell(s, "回到最近接应点，巡查与已取得的信息一同恢复。");
  }
  if (action.type === "coast" && s.chapter === "CH04_COASTAL_EVACUATION") {
    const result = coastStep(s.coast, action.action);
    s.coast = result.state;
    return tell(s, result.message);
  }
  if (
    action.type === "understand" &&
    s.chapter === "CH05_ATHENS" &&
    s.athens.phase === "argument"
  ) {
    const expected: Record<string, string> = {
      epicurean: "peace",
      stoic: "order",
      seeker: "meaning",
    };
    if (expected[action.id] !== action.interpretation)
      return tell(
        s,
        "这不是对方表达的问题。再听一次原话，避免把不同观点简化成刻板印象。",
      );
    listAdd(s.athens.understood, action.id);
    return tell(
      s,
      "你准确复述了这位虚构听者的问题。现在可以带着理解组织交流。",
    );
  }
  if (
    action.type === "athens-match" &&
    s.chapter === "CH05_ATHENS" &&
    s.athens.phase === "argument"
  ) {
    if (s.athens.understood.length < 3)
      return tell(s, "先聆听并理解三位听者，不急于套上自己的回答。");
    if (
      action.card !== action.slot ||
      !ATHENS_CARDS.some((c) => c.id === action.card)
    )
      return tell(s, "此处论证尚未对应问题。查看相关经文，再调整关联。");
    s.athens.matched[action.slot] = action.card;
    listAdd(s.journal, ATHENS_CARDS.find((c) => c.id === action.card)!.ref);
    if (Object.keys(s.athens.matched).length === 6)
      s.athens.phase = "responses";
    return tell(
      s,
      Object.keys(s.athens.matched).length === 6
        ? "保罗的见证从创造、人的处境走向悔改、审判与复活。不同回应仍然并存。"
        : ATHENS_CARDS.find((c) => c.id === action.card)!.explanation,
    );
  }
  if (
    action.type === "response" &&
    s.chapter === "CH05_ATHENS" &&
    s.athens.phase === "responses" &&
    ["mock", "again", "believe"].includes(action.id)
  ) {
    listAdd(s.athens.responses, action.id);
    return tell(
      s,
      {
        mock: "有人讥诮。你听见这份分歧，不用羞辱来换取胜利。",
        again: "有人愿再听。你为继续交流留下一个会面的空间。",
        believe:
          "也有人相信，包括丢尼修和大马哩（徒17:34）。这不是玩家辩论积分换来的结果。",
      }[action.id]!,
    );
  }
  if (s.chapter === "CH06_CORINTH_WORKSHOP") {
    const w = s.workshop,
      order = ORDERS[w.order];
    if (
      action.type === "place" &&
      w.phase === "craft" &&
      w.stage === "layout" &&
      order
    ) {
      const placements = placePiece(order, w.placements, action.placement);
      if (!placements) return tell(s, "裁片越界或重叠。重新摆放，不损失材料。");
      w.placements = placements;
      return tell(s, "裁片已放好。量好位置，再裁切；工具与模板均为示意重建。");
    }
    if (action.type === "remove-piece" && w.stage === "layout") {
      w.placements = w.placements.filter((p) => p.id !== action.id);
      return tell(s, "取回裁片，重新规划。");
    }
    if (action.type === "work") {
      if (action.action === "report" && w.phase === "report") {
        w.phase = "memory";
        listAdd(s.memories, "提摩太带回消息");
        return tell(
          s,
          "工坊的声音停下来。西拉和提摩太从马其顿来到。帖前3:6–8记述信心、爱心与相互思念的消息。让走过的记忆与书信重新相连。",
        );
      }
      if (w.phase !== "craft")
        return tell(s, "现在是同工重聚与记忆回顾的时刻。");
      if (action.action === "rest") {
        w.day++;
        w.hours = w.day % 7 === 0 ? 0 : 6;
        w.fatigue = Math.max(0, w.fatigue - 35);
        w.income = Math.max(0, w.income - 1);
        w.needsPaid++;
        w.schedule.push(`第${w.day - 1}日：收工、用餐、休息`);
        if (w.day % 7 === 0) {
          listAdd(w.encounters, "Sabbath");
          w.schedule.push("安息日：会堂讲论的经文片段（徒18:4）");
        }
        return tell(
          s,
          w.day % 7 === 0
            ? "进入安息日片段。保罗在会堂讲论；普通生产暂停。可探访或歇下，再进入下一日。"
            : "收工，用餐与休息。日用需要消耗1模型钱币；无钱也不剥夺基本生活，下个工作日重新开始。",
        );
      }
      const costs: Record<string, number> = {
        cut: 2,
        stitch: 2,
        deliver: 1,
        buy: 1,
        borrow: 2,
        meal: 1,
        care: 1,
        gather: 1,
      };
      const cost = costs[action.action];
      if (cost === undefined || w.hours < cost)
        return tell(s, "今日可用时段不足。先收工、用餐与休息，不必透支身体。");
      if (["cut", "stitch"].includes(action.action) && w.fatigue >= 75)
        return tell(s, "身体太疲倦，精细工作需要歇息后继续。");
      if (action.action === "cut") {
        if (!order || w.stage !== "layout" || !readyToCut(order, w.placements))
          return tell(s, "先把所有裁片放入原料范围，不重叠、不留空。");
        const needed = order.cols * order.rows;
        if (w.materials < needed)
          return tell(
            s,
            `这单需要${needed}份模型材料。先采购，材料不会凭空增加。`,
          );
        w.materials -= needed;
        w.stage = "cut";
      } else if (action.action === "stitch") {
        if (w.stage !== "cut")
          return tell(s, "先完成量度与裁切，再共用工具拼接。");
        w.stage = "stitched";
      } else if (action.action === "deliver") {
        if (w.stage !== "stitched" || !order)
          return tell(s, "先裁切和拼接，再交付订单。");
        w.income += order.reward;
        w.completedOrders.push(order.id);
        w.order++;
        w.placements = [];
        w.stage = "layout";
      } else if (action.action === "buy") {
        if (w.income < 3)
          return tell(
            s,
            "采购需要3模型钱币。可以先完成已有订单，不提供付费补充。",
          );
        w.income -= 3;
        w.materials += 12;
      } else if (action.action === "borrow") {
        if (!order || w.income >= 3 || w.materials >= order.cols * order.rows)
          return tell(s, "目前可以正常工作或采购，先用已有资源。");
        w.materials += 12;
        w.schedule.push(
          "缺料时，与虚构同行者整理可借用的边角料；具体安排为创作",
        );
      } else if (action.action === "meal") {
        w.fatigue = Math.max(0, w.fatigue - 20);
        w.schedule.push("共同用餐：腾出一段可以交谈的时间");
      } else if (action.action === "care") {
        const person = action.encounter ?? "Justus";
        if (!["Justus", "Crispus", "Aquila", "Priscilla"].includes(person))
          return tell(s, "没有这项人物记载。");
        if (w.encounters.includes(person))
          return tell(s, "这段记载已收入手记。");
        listAdd(w.encounters, person);
        w.schedule.push(`接待与相识：${person}`);
      } else if (action.action === "gather") {
        listAdd(w.encounters, "Sabbath");
        w.schedule.push("回顾安息日会堂讲论（徒18:4），并非把任意日改成安息日");
      }
      w.hours -= cost;
      w.fatigue += action.action === "meal" ? 0 : 8;
      if (
        w.completedOrders.length === 3 &&
        ["Justus", "Crispus", "Sabbath"].every((p) => w.encounters.includes(p))
      )
        w.phase = "report";
      const notes: Record<string, string> = {
        Justus:
          "提多犹士都是敬拜神的人，家靠近会堂（徒18:7）。具体探访操作为创作。",
        Crispus:
          "管会堂的基利司布全家信主（徒18:8）。这是经文事件，不由玩家决定是否发生。",
      };
      return tell(
        s,
        w.phase === "report"
          ? "一个寻常工作日，门口出现熟悉的身影。西拉和提摩太从马其顿来了……"
          : action.action === "care"
            ? (notes[action.encounter ?? "Justus"] ??
              "亚居拉和百基拉与保罗同住同工；具体生活细节是重建。")
            : `已完成${({ cut: "裁切", stitch: "共同拼接", deliver: "交付", buy: "采购", borrow: "整理借用材料", meal: "用餐", gather: "会堂记忆" } as Record<string, string>)[action.action]}。工作与共同生活都占用真实的日程余裕。`,
      );
    }
    if (action.type === "memory-match" && w.phase === "memory") {
      if (
        action.slot !== action.card ||
        !MEMORIES.some((m) => m.id === action.card)
      )
        return tell(s, "这份记忆尚未对应。看看旅程与经文的关联，继续整理。");
      w.memories[action.slot] = action.card;
      if (Object.keys(w.memories).length === 5) w.phase = "done";
      return tell(
        s,
        w.phase === "done"
          ? "感恩、牵挂与教导汇到写字桌旁。你整理的是背景，不创造或改写书信。"
          : MEMORIES.find((m) => m.id === action.card)!.explanation,
      );
    }
  }
  if (s.chapter === "EPILOGUE_FIRST_LETTER") {
    if (action.type === "open-letter") {
      s.letterOpen = true;
      return tell(
        s,
        "第二篇：一封信，如何建立一间教会。视角由旅伴转向听信的群体；前传记忆仍可查阅。",
      );
    }
    if (action.type === "receive-letter" && s.letterOpen) {
      s.letter.phase = "reading";
      return tell(
        s,
        "一位未具名的虚构送信人带来书信。其身份与路线未见于经文记载。你成为聚会中的听信者。",
      );
    }
    if (
      action.type === "read-letter" &&
      s.letterOpen &&
      s.letter.phase !== "arrival" &&
      Number.isInteger(action.page) &&
      action.page >= 0 &&
      action.page < 5
    ) {
      s.letter.page = action.page;
      listAdd(s.letter.heard, action.page);
      if (s.letter.heard.includes(0)) s.letter.phase = "community";
      return tell(
        s,
        "书信导览已打开。现在把具体照顾安排交给能接续的人，旅程记忆仍保存在手记。",
      );
    }
    if (
      action.type === "assign-care" &&
      s.letter.phase === "community" &&
      !s.letter.dayComplete
    ) {
      if (
        !CARE_TASKS.some((t) => t.id === action.task) ||
        !CARE_PEOPLE.some((p) => p.id === action.person)
      )
        return s;
      s.letter.assignments[action.task] = action.person;
      return tell(s, "已调整群体分工。留意每个人可用的普通时间。");
    }
    if (action.type === "care-day" && s.letter.phase === "community") {
      if (s.letter.dayComplete)
        return tell(s, "今天的照顾安排已接续。没有可反复刷取的宗教积分。");
      const allAssigned = CARE_TASKS.every((t) => s.letter.assignments[t.id]);
      const capacity = CARE_PEOPLE.every(
        (p) =>
          CARE_TASKS.filter((t) => s.letter.assignments[t.id] === p.id).reduce(
            (a, t) => a + t.hours,
            0,
          ) <= p.hours,
      );
      if (!allAssigned || !capacity)
        return tell(
          s,
          "有人被分配过多事务，或一项照顾尚未有人接手。重新分担，别让一个人包办所有事。",
        );
      s.letter.dayComplete = true;
      listAdd(s.flags, "living-letter-first-day");
      return tell(
        s,
        "手艺人得到合作的机会，家庭收到晚饭，悲伤中的邻舍有人陪伴。虚构群体的具体照顾接续了；这不是信心、爱心或盼望的分数。",
      );
    }
  }
  return state;
}
export function replayChapter(state: Campaign, chapter: ChapterId): Campaign {
  if (chapter !== state.chapter && !state.completed.includes(chapter))
    return state;
  const next = structuredClone(state),
    initial = freshCampaign(state.escape);
  next.chapter = chapter;
  if (chapter === "CH01_MIDNIGHT_ESCAPE") next.escape = freshGame();
  if (chapter === "CH02_78KM_ROAD") next.road = initial.road;
  if (chapter === "CH03_BEREA_CRISIS") {
    next.berea = initial.berea;
    if (state.road.supports)
      next.berea.explorer.found = next.berea.explorer.checkpoint.found = [
        "companion",
      ];
  }
  if (chapter === "CH04_COASTAL_EVACUATION") next.coast = createCoast();
  if (chapter === "CH05_ATHENS") next.athens = initial.athens;
  if (chapter === "CH06_CORINTH_WORKSHOP") next.workshop = initial.workshop;
  if (chapter === "EPILOGUE_FIRST_LETTER") {
    next.letterOpen = false;
    next.letter = initial.letter;
  }
  return tell(
    next,
    `重游${CHAPTERS.find((c) => c.id === chapter)!.title}。原有旅程记忆仍保留。`,
  );
}

export function replayPrologue(state: Campaign): Campaign {
  const next = freshCampaign(freshGame());
  next.memories = [...state.memories];
  next.journal = [...state.journal];
  next.modern = structuredClone(state.modern);
  next.revision = state.revision;
  return tell(
    next,
    "新一轮前传从午夜开始。操作进度重新开始，已发现经文、旅程记忆和本机个人反思保留。",
  );
}
