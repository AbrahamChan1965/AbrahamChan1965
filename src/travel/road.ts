export type Pace = "steady" | "quick" | "careful";
export type RoadRoute = "open" | "sheltered";
export type RoadSnapshot = {
  km: number;
  hours: number;
  fatigue: number;
  companionFatigue: number;
  supports: number;
  water: number;
  food: number;
  exposure: number;
  turn: number;
  refilled: number[];
  clues: number[];
  choices: string[];
};
export type RoadState = RoadSnapshot & {
  pace: Pace;
  route: RoadRoute;
  status: "walking" | "setback" | "arrived";
  checkpoint: RoadSnapshot;
};
export const ROAD_ENDS = [18, 38, 60, 78];
export const ROAD_STAGES = [
  "离城后的道路",
  "田野与岔路",
  "途中歇脚处",
  "接近庇哩亚",
];
export const roadStage = (r: RoadSnapshot) =>
  Math.min(
    3,
    ROAD_ENDS.findIndex((end) => r.km < end) < 0
      ? 3
      : ROAD_ENDS.findIndex((end) => r.km < end),
  );
export function createRoad(): RoadState {
  const initial: RoadSnapshot = {
    km: 0,
    hours: 0,
    fatigue: 8,
    companionFatigue: 18,
    supports: 0,
    water: 10,
    food: 8,
    exposure: 0,
    turn: 0,
    refilled: [],
    clues: [],
    choices: [],
  };
  return {
    ...initial,
    pace: "steady",
    route: "open",
    status: "walking",
    checkpoint: structuredClone(initial),
  };
}
export type RoadAction =
  | { type: "pace"; value: Pace }
  | { type: "route"; value: RoadRoute }
  | { type: "move" | "rest" | "refill" | "investigate" | "support" | "retry" };
export function roadStep(
  state: RoadState,
  action: RoadAction,
): { state: RoadState; message: string } {
  if (action.type === "retry")
    return {
      state: {
        ...state,
        ...structuredClone(state.checkpoint),
        status: "walking",
      },
      message: "回到上一地标；可以改变步速和路线。",
    };
  if (state.status !== "walking")
    return {
      state,
      message:
        state.status === "arrived"
          ? "庇哩亚就在眼前。"
          : "先回到上一地标调整策略。",
    };
  if (action.type === "pace" || action.type === "route")
    return {
      state: { ...state, [action.type]: action.value },
      message:
        action.type === "pace"
          ? "已调整步速；观察消耗再出发。"
          : "已调整路线；遮蔽道路耗水更多，暴露较少。",
    };
  const next = structuredClone(state),
    stage = roadStage(state);
  let message = "";
  if (action.type === "move") {
    const km = { steady: 6, quick: 10, careful: 4 }[state.pace];
    next.km = Math.min(ROAD_ENDS[stage], state.km + km);
    next.hours += state.pace === "careful" ? 3 : 2;
    next.fatigue = Math.max(
      0,
      next.fatigue + { steady: 9, quick: 19, careful: -2 }[state.pace],
    );
    next.companionFatigue = Math.max(
      0,
      next.companionFatigue +
        { steady: 12, quick: 23, careful: -6 }[state.pace],
    );
    next.water -= state.route === "sheltered" ? 2 : 1;
    next.turn++;
    if (next.turn % 2 === 0) next.food--;
    next.exposure = Math.max(
      0,
      state.exposure +
        (state.route === "open" ? (state.pace === "quick" ? 2 : 1) : -2),
    );
    next.choices.push(`${stage}:${state.pace}:${state.route}`);
    message = `前进 ${next.km - state.km} 公里（模型）。${state.pace === "quick" ? "急行省下路段，但身体更疲惫。" : "你们依步速继续前行。"}`;
  } else if (action.type === "rest") {
    next.hours += 4;
    next.fatigue = Math.max(0, state.fatigue - 32);
    next.companionFatigue = Math.max(0, state.companionFatigue - 36);
    next.food--;
    next.water--;
    next.exposure = Math.max(0, state.exposure - 3);
    message =
      "歇下四个模型时段，身体恢复。虚构同行者记得夜里留下的家庭：离开不等于不再牵挂。（对话为创作）";
  } else if (action.type === "support") {
    next.hours += 2;
    next.water--;
    next.food--;
    next.supports++;
    next.fatigue += 5;
    next.companionFatigue = Math.max(0, next.companionFatigue - 30);
    message =
      "你分担虚构同行者的行李和食水。对方恢复了余裕，你自己也付出体力；这份照顾将影响庇哩亚的接应。";
  } else if (action.type === "refill") {
    if (state.refilled.includes(stage))
      return { state, message: "这一带的补给机会已用过。到下一地标再寻找。" };
    next.refilled.push(stage);
    next.hours += 2;
    next.water += 7;
    next.food += 3;
    next.exposure++;
    message = "你绕到一处虚构补给点补充食水。用了额外时间，也增加了一点暴露。";
  } else {
    if (state.clues.includes(stage))
      return { state, message: "这一带的路况已记在手记。" };
    next.clues.push(stage);
    next.hours++;
    next.exposure = Math.max(0, state.exposure - 2);
    message = [
      "你辨认离城方向：地图向西南连到庇哩亚。不是战术小地图的真实方位复原。",
      "你问清一处岔路，避免误把转述当可靠道路消息。",
      "你找到可歇脚的地方，普通人的身体需要休息。",
      "前方是庇哩亚；这78公里与约两天只是地理模型。",
    ][stage];
  }
  if (
    next.water <= 0 ||
    next.food < 0 ||
    next.fatigue >= 90 ||
    next.companionFatigue >= 95 ||
    next.exposure >= 12
  ) {
    next.status = "setback";
    return {
      state: next,
      message:
        "旅途受阻：食水、疲劳或暴露超过了安全余裕。回到地标改变策略；这不改写保罗的行程。",
    };
  }
  if (next.km >= 78) {
    next.status = "arrived";
    message = "庇哩亚出现在前方。教会的故事，将在另一座城继续。";
  } else if (ROAD_ENDS.includes(next.km) && next.km !== state.km) {
    const {
      checkpoint: _,
      pace: __,
      route: ___,
      status: ____,
      ...snapshot
    } = next;
    next.checkpoint = structuredClone(snapshot);
    message += " 抵达地标，自动保存恢复点。";
  }
  return { state: next, message };
}
