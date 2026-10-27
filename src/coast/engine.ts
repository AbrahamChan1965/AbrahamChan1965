export type CoastState = {
  stage: "escort" | "choice" | "sea" | "land" | "arrived";
  approach: number;
  clues: string[];
  messageSent: boolean;
  route: "sea" | "land" | null;
  progress: number;
  hours: number;
  water: number;
  food: number;
  fatigue: number;
  setback: boolean;
  sail: number;
  rests: number;
};
export function createCoast(fatigue = 0): CoastState {
  return {
    stage: "escort",
    approach: 0,
    clues: [],
    messageSent: false,
    route: null,
    progress: 0,
    hours: 0,
    water: 12,
    food: 8,
    fatigue: Math.min(30, fatigue),
    setback: false,
    sail: 1,
    rests: 0,
  };
}
export const WINDS = [1, 0, 2, 1, 2];
export type CoastAction =
  | { type: "info"; id: string }
  | { type: "route"; route: "sea" | "land" }
  | { type: "sail"; value: number }
  | { type: "approach" | "send" | "advance" | "rest" | "retry" };
export function coastStep(
  state: CoastState,
  action: CoastAction,
): { state: CoastState; message: string } {
  const next = structuredClone(state);
  if (action.type === "retry") {
    const reset = createCoast();
    reset.stage = state.route ?? "escort";
    reset.route = state.route;
    reset.clues = state.clues;
    reset.messageSent = state.messageSent;
    reset.approach = state.approach;
    return {
      state: reset,
      message: "回到这一段的接应点。已问到的消息仍保留，食水与护送状态恢复。",
    };
  }
  if (state.setback || state.stage === "arrived")
    return {
      state,
      message: state.setback ? "请先恢复这一段护送。" : "雅典已经抵达。",
    };
  let message = "";
  if (action.type === "sail")
    return {
      state: { ...state, sail: Math.max(0, Math.min(2, action.value)) },
      message: "调整帆面，下一回合再航行。没有实时反应限制。",
    };
  if (action.type === "info") {
    if (
      !["transport", "weather"].includes(action.id) ||
      state.clues.includes(action.id)
    )
      return { state, message: "该消息已经记录或无法核验。" };
    next.clues.push(action.id);
    next.hours++;
    message =
      action.id === "transport"
        ? "问清转运方式。彼拿一带只是沿岸出发假说，实际港口并不确定。"
        : "你取得虚构天气与陆路消息，可以比较时间和补给代价。不是路加记载的天气。";
  } else if (action.type === "send") {
    if (state.messageSent)
      return { state, message: "给暂留同工的集合消息已经托付。" };
    next.messageSent = true;
    next.hours++;
    message =
      "你把集合消息托付给护送者。西拉和提摩太暂留庇哩亚；到雅典后，保罗请他们快来（徒17:14–15）。具体递信操作为创作。";
  } else if (action.type === "route") {
    if (
      state.stage !== "choice" ||
      state.clues.length < 2 ||
      !state.messageSent
    )
      return { state, message: "先到达转运点、问清两项消息，并交托集合信息。" };
    next.route = action.route;
    next.stage = action.route;
    next.progress = 0;
    message =
      action.route === "sea"
        ? "选择海路重建：观察风向，分段航行；实际航线未详。"
        : "选择陆路重建：耗时更多，需要休整；不宣称这是经文明载路线。";
  } else if (action.type === "rest") {
    next.hours += 4;
    next.fatigue = Math.max(0, state.fatigue - 30);
    next.food--;
    next.water = Math.min(14, state.water + 3);
    next.rests++;
    message = "在虚构停靠处休整、补水，消耗食物与时间。队伍可以重新出发。";
  } else if (action.type === "approach") {
    if (state.stage !== "escort")
      return { state, message: "已到沿岸转运区域。" };
    next.approach++;
    next.hours += 3;
    next.water--;
    next.fatigue += 10;
    if (next.approach === 4) next.stage = "choice";
    message =
      next.stage === "choice"
        ? "到达沿岸转运区。约40公里为模型估算，彼拿不是经文确认的港口。"
        : "护送向海边前进一步。地图所示为重建区段。";
  } else {
    if (state.stage !== "sea" && state.stage !== "land")
      return { state, message: "先完成护送与路线筹划。" };
    next.hours += state.route === "land" ? 5 : 2;
    next.water--;
    next.food -= state.progress % 2;
    if (state.route === "sea" && state.sail !== WINDS[state.progress]) {
      next.fatigue += 9;
      message =
        "帆面与风标不合，暂未前进，消耗一个时段与饮水。可调整后重试；没有船难剧情。";
    } else {
      next.progress++;
      next.fatigue += state.route === "land" ? 14 : 4;
      message =
        state.route === "land"
          ? "沿陆路重建方案前进，耗时与体力较多。"
          : "帆面配合风标，安全航过一个模拟区段。";
      if (next.progress >= 5) {
        next.stage = "arrived";
        message = "抵达雅典。保罗与护送者来到城中，并请西拉和提摩太快来。";
      }
    }
  }
  if (next.water <= 0 || next.food < 0 || next.fatigue >= 90) {
    next.setback = true;
    message = "护送受阻。返回接应点重排路线，不改变保罗抵达雅典的事实。";
  }
  return { state: next, message };
}
