import { CHAPTERS, type ChapterId } from "./content";
import { canContinue, type Campaign } from "./state";

export function sceneGoal(s: Campaign): string {
  switch (s.chapter) {
    case "CH01_MIDNIGHT_ESCAPE":
      return "抵达H1城外接应点；途中可选联络两户家庭。";
    case "CH02_78KM_ROAD":
      return "照顾食水与两人的疲劳，完成78模型公里，到达庇哩亚。";
    case "CH03_BEREA_CRISIS":
      return s.berea.phase === "table"
        ? "把三组经文线索与主题关联，再体验突发撤离。"
        : "取得护送与道路消息，抵达F1出口。";
    case "CH04_COASTAL_EVACUATION":
      return "护送、查问两项消息并托付联络，选择海路或陆路抵达雅典。";
    case "CH05_ATHENS":
      return s.athens.phase === "explore"
        ? "走访六处地点，站在标记处调查，聆听不同的问题。"
        : s.athens.phase === "argument"
          ? "理解三位听者，整理六组论证关联。"
          : "接触三种回应，再前往哥林多。";
    case "CH06_CORINTH_WORKSHOP":
      return s.workshop.phase === "craft"
        ? "完成三份订单，安排工作与休息，认识会堂和两位人物。"
        : s.workshop.phase === "report"
          ? "放下工具，听取西拉和提摩太带回的消息。"
          : "把五项旅程记忆与书信的感恩、牵挂相连。";
    case "EPILOGUE_FIRST_LETTER":
      return !s.letterOpen
        ? "回看旅程，打开第一封信。"
        : s.letter.phase === "arrival"
          ? "接过书信，以听信者的视角进入聚会。"
          : s.letter.phase === "reading"
            ? "听第一章，再把照顾任务交给群体中的人。"
            : "按每个人可用时间分配三项照顾任务，让安排开始。";
  }
}
export function SceneNavigation({
  state,
  onNext,
  onMenu,
}: {
  state: Campaign;
  onNext: () => void;
  onMenu: () => void;
}) {
  const i = CHAPTERS.findIndex((c) => c.id === state.chapter);
  const achieved =
    canContinue(state) ||
    (state.chapter === "EPILOGUE_FIRST_LETTER" && state.letter.dayComplete);
  return (
    <section className="scene-navigation" aria-label="本场景目标与自由切换">
      <div>
        <span className="eyebrow">本场景目标</span>
        <strong>{sceneGoal(state)}</strong>
        <p>
          {achieved ? "目标已达成。" : "目标尚未完成。"}{" "}
          可以随时换场景，进度会保留。
        </p>
      </div>
      <div className="scene-navigation-actions">
        <button className="primary" onClick={onNext}>
          {i < CHAPTERS.length - 1
            ? "下一个场景 →"
            : state.letterOpen && state.letter.phase === "community"
              ? "换个场景玩 →"
              : "下一个场景 →"}
        </button>
        <button onClick={onMenu}>选择场景</button>
      </div>
    </section>
  );
}
export type SceneDestination = ChapterId | "LIVING_LETTER";
