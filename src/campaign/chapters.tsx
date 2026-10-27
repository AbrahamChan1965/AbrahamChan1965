import { useState } from "react";
import { BEREA_MAP, ATHENS_MAP } from "../game/exploration";
import { ROAD_STAGES, roadStage, type Pace } from "../travel/road";
import { WINDS } from "../coast/engine";
import {
  CHAPTERS,
  BEREA_CARDS,
  BEREA_SLOTS,
  ATHENS_CARDS,
  ATHENS_SLOTS,
  MEMORIES,
  MEMORY_SLOTS,
  LETTER_INTRO,
} from "./content";
import {
  CARE_TASKS,
  CARE_PEOPLE,
  type Campaign,
  type CampaignAction,
} from "./state";
import { ClueBoard } from "../ui/ClueBoard";
import { Explorer } from "../ui/Explorer";
import { ORDERS, cellsFor } from "../corinth/crafting";
import { WorldMap } from "./WorldMap";
type Props = {
  state: Campaign;
  dispatch: (action: CampaignAction) => void;
  paused?: boolean;
};
export function Stats({
  items,
}: {
  items: { label: string; value: string | number; danger?: boolean }[];
}) {
  return (
    <div className="campaign-stats">
      {items.map((item) => (
        <div key={item.label} className={item.danger ? "warning" : ""}>
          <small>{item.label}</small>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
export function RoadChapter({ state, dispatch }: Props) {
  const r = state.road,
    section = roadStage(r),
    act = (action: Parameters<typeof import("../travel/road").roadStep>[1]) =>
      dispatch({ type: "road", action });
  return (
    <div className="chapter-play road-chapter">
      <div className="chapter-art">
        <WorldMap current={state.chapter} />
        <div className="art-caption">
          <span className="evidence-tag">历史估算</span>
          <p>
            约78公里、约两天是指引采用的模型，非路加记载。地标与食水消耗均为游戏化。
          </p>
        </div>
      </div>
      <Stats
        items={[
          { label: "剩余模型公里", value: 78 - r.km },
          { label: "行程时段", value: `${r.hours} 小时` },
          { label: "饮水", value: r.water, danger: r.water <= 3 },
          { label: "食物", value: r.food, danger: r.food <= 2 },
          { label: "我的疲劳", value: r.fatigue, danger: r.fatigue >= 65 },
          {
            label: "同伴疲劳",
            value: r.companionFatigue,
            danger: r.companionFatigue >= 65,
          },
          { label: "暴露", value: `${r.exposure}/12`, danger: r.exposure >= 9 },
        ]}
      />
      <div className="road-landmarks" aria-label="道路地标">
        {ROAD_STAGES.map((title, i) => (
          <div
            key={title}
            className={i === section ? "current" : i < section ? "done" : ""}
          >
            <span>{i < section ? "✓" : `0${i + 1}`}</span>
            <strong>{title}</strong>
            <small>{[18, 38, 60, 78][i]} km</small>
          </div>
        ))}
      </div>
      <progress aria-label="通往庇哩亚的旅程进度" value={r.km} max={78} />
      <p className="journey-position">
        已经走过 {r.km} / 78 模型公里 · 第 {Math.floor(r.hours / 24) + 1}{" "}
        个模型日
      </p>
      {r.status === "walking" && (
        <>
          <div className="planning-row">
            <fieldset>
              <legend>步速 · 每次行进结算一个区段</legend>
              {(
                [
                  {
                    id: "steady",
                    title: "稳健",
                    desc: "最多6km／2时段 · 疲劳+9",
                  },
                  {
                    id: "quick",
                    title: "急行",
                    desc: "最多10km／2时段 · 疲劳+19",
                  },
                  {
                    id: "careful",
                    title: "慢行",
                    desc: "最多4km／3时段 · 恢复少量疲劳",
                  },
                ] as { id: Pace; title: string; desc: string }[]
              ).map((p) => (
                <label
                  className={`plan-option ${r.pace === p.id ? "chosen" : ""}`}
                  key={p.id}
                >
                  <input
                    type="radio"
                    name="pace"
                    checked={r.pace === p.id}
                    onChange={() => act({ type: "pace", value: p.id })}
                  />
                  <strong>{p.title}</strong>
                  <small>{p.desc}</small>
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>道路 · 可以随地形调整</legend>
              {(
                [
                  {
                    id: "open",
                    title: "较开阔的通路",
                    desc: "每次饮水−1，暴露增加",
                  },
                  {
                    id: "sheltered",
                    title: "遮蔽的绕行",
                    desc: "每次饮水−2，暴露降低",
                  },
                ] as const
              ).map((p) => (
                <label
                  className={`plan-option ${r.route === p.id ? "chosen" : ""}`}
                  key={p.id}
                >
                  <input
                    type="radio"
                    name="road-route"
                    checked={r.route === p.id}
                    onChange={() => act({ type: "route", value: p.id })}
                  />
                  <strong>{p.title}</strong>
                  <small>{p.desc}</small>
                </label>
              ))}
            </fieldset>
          </div>
          <div className="chapter-actions">
            <button className="primary" onClick={() => act({ type: "move" })}>
              沿路前进 →
            </button>
            <button onClick={() => act({ type: "rest" })}>
              共同歇脚 · 用食水换恢复
            </button>
            <button onClick={() => act({ type: "support" })}>
              分担同伴行李
            </button>
            <button
              disabled={r.refilled.includes(section)}
              onClick={() => act({ type: "refill" })}
            >
              绕访补给点
            </button>
            <button
              disabled={r.clues.includes(section)}
              onClick={() => act({ type: "investigate" })}
            >
              查问本段路况
            </button>
          </div>
          <p className="board-note">
            急行也会加重同伴疲劳。达到90疲劳、同伴95、饮水耗尽或暴露12时，返回最近地标。扶持一位虚构同伴，会改变庇哩亚的接应。
          </p>
        </>
      )}
      {r.status === "setback" && (
        <div className="setback" role="alert">
          <h3>旅程暂时受阻</h3>
          <p>
            补给、疲劳或暴露已超出余裕。保罗的经文行程不变，你可以重排策略。
          </p>
          <button className="primary" onClick={() => act({ type: "retry" })}>
            回到最近地标
          </button>
        </div>
      )}
      {r.status === "arrived" && (
        <div className="chapter-resolution">
          <p className="eyebrow">抵达 · 庇哩亚</p>
          <h2>忍耐不是永远不疲倦。</h2>
          <p>
            你们在有限的食水、身体和时间中继续前行。接下来，先停在经文面前。
          </p>
        </div>
      )}
    </div>
  );
}
export function BereaChapter({ state, dispatch, paused }: Props) {
  const b = state.berea;
  return (
    <div className="chapter-play">
      <div className="scene-intro">
        <span className="scene-icon">▤</span>
        <div>
          <p className="eyebrow">热切领受 · 天天查验</p>
          <h2>
            {b.phase === "table"
              ? "把问题带到书卷前"
              : b.phase === "crisis"
                ? "安静被一则消息打断"
                : "有些同工暂时留下"}
          </h2>
          <p>
            {b.phase === "table"
              ? "把三组文本线索放到相应的论证位置。没有倒数。这里的具体书卷组合是学习用交叉参考，并非庇哩亚当日书单。"
              : "来自帖撒罗尼迦的部分反对者来到，搅扰再起。你要联络护送同伴、取得道路信息并到F1出口；西拉和提摩太仍留在庇哩亚。"}
          </p>
        </div>
      </div>
      {b.phase === "table" && (
        <ClueBoard
          label="庇哩亚经文研究桌"
          cards={BEREA_CARDS}
          slots={BEREA_SLOTS}
          matched={b.matched}
          onMatch={(slot, card) =>
            dispatch({ type: "berea-match", slot, card })
          }
        />
      )}
      {b.phase === "crisis" && (
        <>
          <div className="mission-strip">
            <span
              className={
                b.explorer.found.includes("companion") ? "complete" : ""
              }
            >
              ◇ 护送同伴 · B4
            </span>
            <span
              className={
                b.explorer.found.includes("coast-note") ? "complete" : ""
              }
            >
              ◇ 道路消息 · E2
            </span>
            <span>↗ 出口 · F1</span>
          </div>
          {state.flags.includes("companion-help") && (
            <p className="carry-over">
              路上受过扶持的虚构同伴提前确认了集合信息；你现在已有第一项接应。这是上一幕行动的具体后果。
            </p>
          )}
          <Explorer
            label="庇哩亚撤离地图"
            map={BEREA_MAP}
            state={b.explorer}
            paused={paused}
            onAction={(action) => dispatch({ type: "explore", action })}
            onRetry={() => dispatch({ type: "explore-retry" })}
          />
        </>
      )}
      {b.phase === "departed" && (
        <div className="chapter-resolution">
          <h2>保罗向海边去。</h2>
          <p>
            西拉和提摩太仍留在庇哩亚。查验没有消除危险，危险也没有抹去查验的价值。（徒17:14–15）
          </p>
        </div>
      )}
    </div>
  );
}
export function CoastChapter({ state, dispatch }: Props) {
  const c = state.coast,
    act = (action: Parameters<typeof import("../coast/engine").coastStep>[1]) =>
      dispatch({ type: "coast", action });
  return (
    <div className="chapter-play">
      <div className="chapter-art">
        <WorldMap current={state.chapter} />
        <div className="art-caption">
          <span className="evidence-tag uncertain-tag">尚未确定</span>
          <p>
            往海边及抵达雅典为经文明载；彼拿一带约40公里、海陆方案是历史地理假说与创作重建，非确认航线。
          </p>
        </div>
      </div>
      <Stats
        items={[
          { label: "护送区段", value: `${c.approach}/4` },
          { label: "饮水", value: c.water, danger: c.water <= 3 },
          { label: "食物", value: c.food },
          { label: "身体疲劳", value: c.fatigue, danger: c.fatigue >= 65 },
          { label: "模型时段", value: c.hours },
        ]}
      />
      <div className="scene-intro">
        <span className="scene-icon">≈</span>
        <div>
          <h2>
            {c.stage === "escort"
              ? "队伍分开，道路继续"
              : c.stage === "choice"
                ? "收集消息，再选择交通"
                : c.stage === "arrived"
                  ? "雅典出现在前方"
                  : c.route === "sea"
                    ? "照着风标，一段段航行"
                    : "陆路也有它的代价"}
          </h2>
          <p>
            你协助护送；西拉与提摩太暂留庇哩亚。集合消息可以跨过暂时的分离。
          </p>
        </div>
      </div>
      {!c.setback && c.stage !== "arrived" && (
        <>
          <div className="chapter-actions">
            {c.stage === "escort" && (
              <button
                className="primary"
                onClick={() => act({ type: "approach" })}
              >
                护送向海边前进
              </button>
            )}
            <button
              disabled={c.messageSent}
              onClick={() => act({ type: "send" })}
            >
              {c.messageSent ? "✓ 集合消息已托付" : "托付集合消息"}
            </button>
            <button
              disabled={c.clues.includes("transport")}
              onClick={() => act({ type: "info", id: "transport" })}
            >
              {c.clues.includes("transport") ? "✓ " : ""}查问转运方式
            </button>
            <button
              disabled={c.clues.includes("weather")}
              onClick={() => act({ type: "info", id: "weather" })}
            >
              {c.clues.includes("weather") ? "✓ " : ""}查问路况与天气
            </button>
            <button onClick={() => act({ type: "rest" })}>
              停靠休整 · 补水
            </button>
          </div>
          {c.stage === "choice" && (
            <div className="route-cards">
              <button
                disabled={c.clues.length < 2 || !c.messageSent}
                onClick={() => act({ type: "route", route: "sea" })}
              >
                <span>≈</span>
                <strong>海路重建</strong>
                <p>5段航行 · 每段约2模型时段</p>
                <small>调整帆面；匹配风标才前进。没有经文船难。</small>
              </button>
              <button
                disabled={c.clues.length < 2 || !c.messageSent}
                onClick={() => act({ type: "route", route: "land" })}
              >
                <span>⌁</span>
                <strong>陆路重建</strong>
                <p>5段陆行 · 每段约5模型时段</p>
                <small>身体消耗更多，需要休整。实际路线仍未详。</small>
              </button>
            </div>
          )}
          {c.stage === "sea" && (
            <section className="sailing" aria-label="回合制航行">
              <div className="sea-field">
                <div
                  className="sailboat"
                  style={{ transform: `rotate(${(c.sail - 1) * 8}deg)` }}
                >
                  <i />
                  <span>▱</span>
                </div>
                <div className="wind-indicator">
                  下一段风标{" "}
                  <strong>
                    {["↖ 左", "↑ 中", "↗ 右"][WINDS[c.progress]]}
                  </strong>
                  <small>没有倒数，可先调整再出发</small>
                </div>
              </div>
              <div className="sail-controls" role="group" aria-label="调整帆面">
                {["向左", "居中", "向右"].map((label, value) => (
                  <button
                    key={label}
                    aria-pressed={c.sail === value}
                    onClick={() => act({ type: "sail", value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="primary"
                onClick={() => act({ type: "advance" })}
              >
                航行一个区段 →
              </button>
              <progress value={c.progress} max={5} aria-label="航行进度" />
              <p>
                已航行 {c.progress}/5
                段。风标、帆面与延迟是模拟机制，不是路加记载的天气。
              </p>
            </section>
          )}
          {c.stage === "land" && (
            <section className="land-route">
              <div className="land-track">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={i < c.progress ? "done" : ""}>
                    {i < c.progress ? "✓" : i + 1}
                  </span>
                ))}
              </div>
              <button
                className="primary"
                onClick={() => act({ type: "advance" })}
              >
                沿陆路重建方案前进
              </button>
              <p>看见体力下降时，可以停下调整。这些区段不等于已确认古驿站。</p>
            </section>
          )}
        </>
      )}
      {c.setback && (
        <div className="setback" role="alert">
          <h3>这一段需要重新规划</h3>
          <button className="primary" onClick={() => act({ type: "retry" })}>
            回到护送接应点
          </button>
        </div>
      )}
      {c.stage === "arrived" && !c.setback && (
        <div className="chapter-resolution">
          <h2>有限的信息，也能容纳审慎的行动。</h2>
          <p>
            护送者带保罗到雅典。保罗请西拉和提摩太快来（徒17:15）；接下来是在等候中的观察。
          </p>
        </div>
      )}
    </div>
  );
}
const LISTENERS = [
  {
    id: "epicurean",
    title: "一位伊壁鸠鲁学派听者",
    speech: "「人怎样在恐惧中找到安宁？你所说的复活，会带来怎样的理解？」",
    choices: [
      { id: "peace", text: "他关心安宁与恐惧，也对复活提出问题。" },
      { id: "insult", text: "他一定只想放纵，没有值得认真听的事。" },
    ],
  },
  {
    id: "stoic",
    title: "一位斯多亚学派听者",
    speech: "「人与世界的秩序有什么关系？人应当怎样生活？」",
    choices: [
      { id: "cold", text: "他毫无情感，只要命令别人。" },
      { id: "order", text: "他在问秩序、人的处境与生活方式。" },
    ],
  },
  {
    id: "seeker",
    title: "一位愿意再听的听者",
    speech: "「我还没理解复活。我们可以找一个时间再谈吗？」",
    choices: [
      { id: "meaning", text: "他尚有疑问，也留下继续交谈的意愿。" },
      { id: "rejected", text: "他已经拒绝一切，没有继续理解的可能。" },
    ],
  },
];
export function AthensChapter({ state, dispatch, paused }: Props) {
  const a = state.athens;
  return (
    <div className="chapter-play">
      <div className="scene-intro">
        <span className="scene-icon">◇</span>
        <div>
          <p className="eyebrow">雅典 · 等候中的观察</p>
          <h2>
            {a.phase === "explore"
              ? "先走进他们的问题"
              : a.phase === "argument"
                ? "先聆听，再组织见证"
                : "回应并不整齐"}
          </h2>
          <p>
            保罗在会堂和市场交流，遇见不同思想的人。地图、听者对白和任务为重建，不把整个族群或学派定义为敌人。
          </p>
        </div>
      </div>
      {a.phase === "explore" && (
        <>
          <div className="observation-list">
            {ATHENS_MAP.places.map((p) => (
              <span
                className={a.explorer.found.includes(p.id) ? "complete" : ""}
                key={p.id}
              >
                {a.explorer.found.includes(p.id) ? "✓" : "◇"} {p.name} ·{" "}
                {String.fromCharCode(65 + p.position.x)}
                {p.position.y + 1}
              </span>
            ))}
          </div>
          <Explorer
            label="雅典市集探索"
            map={ATHENS_MAP}
            state={a.explorer}
            paused={paused}
            onAction={(action) => dispatch({ type: "explore", action })}
          />
        </>
      )}
      {a.phase === "argument" && (
        <>
          <div className="listener-cards">
            {LISTENERS.map((person) => (
              <article key={person.id}>
                <span className="evidence-tag fiction">创作听者 · 非原话</span>
                <h3>{person.title}</h3>
                <blockquote>{person.speech}</blockquote>
                {a.understood.includes(person.id) ? (
                  <p className="success">✓ 已准确理解关切</p>
                ) : (
                  <div className="listening-choices">
                    {person.choices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() =>
                          dispatch({
                            type: "understand",
                            id: person.id,
                            interpretation: choice.id,
                          })
                        }
                      >
                        {choice.text}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
          <p className="board-note">
            先理解三位听者，再关联六项论证。卡片整理的是徒17中的见证；玩家不替保罗更改讲话。
          </p>
          <ClueBoard
            label="雅典论证关联板"
            cards={ATHENS_CARDS}
            slots={ATHENS_SLOTS}
            matched={a.matched}
            disabled={a.understood.length < 3}
            onMatch={(slot, card) =>
              dispatch({ type: "athens-match", slot, card })
            }
          />
        </>
      )}
      {a.phase === "responses" && (
        <>
          <div className="speech-summary">
            <p className="eyebrow">亚略巴古 · 徒17:22–31 内容概述</p>
            <h2>创造主 → 人的处境 → 悔改 → 公义与复活</h2>
            <p>
              保罗从观察当地敬拜与诗人语言出发，宣讲创造天地、赐生命的神，并呼唤悔改，见证审判与复活。不是靠删去核心信息来换取一致赞同。
            </p>
          </div>
          <div className="response-cards">
            {[
              {
                id: "mock",
                title: "有人讥诮",
                text: "听见分歧，仍尊重对方作为人的尊严。",
              },
              {
                id: "again",
                title: "有人愿再听",
                text: "为继续理解留下时间与空间。",
              },
              {
                id: "believe",
                title: "也有人相信",
                text: "丢尼修、大马哩及其他人（徒17:34）。",
              },
            ].map((item) => (
              <button
                key={item.id}
                className={a.responses.includes(item.id) ? "heard" : ""}
                onClick={() => dispatch({ type: "response", id: item.id })}
              >
                <span>{a.responses.includes(item.id) ? "✓" : "◇"}</span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <small>走近这一组听者</small>
              </button>
            ))}
          </div>
          <p className="fiction-note">
            三类回应有经文依据，具体动线与操作是游戏化。没有辩论生命条或转信人数分数。
          </p>
        </>
      )}
    </div>
  );
}
export function WorkshopChapter({ state, dispatch }: Props) {
  const w = state.workshop,
    order = ORDERS[w.order];
  const [selected, setSelected] = useState("a"),
    [rotated, setRotated] = useState(false);
  const act = (
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
      | "report",
    encounter?: string,
  ) => dispatch({ type: "work", action, encounter });
  const place = (x: number, y: number, id = selected, rotate = rotated) =>
    dispatch({ type: "place", placement: { id, x, y, rotated: rotate } });
  return (
    <div className="chapter-play">
      <div className="scene-intro">
        <span className="scene-icon">⌂</span>
        <div>
          <p className="eyebrow">哥林多 · 亚居拉与百基拉</p>
          <h2>
            {w.phase === "report"
              ? "一个寻常工作日，有人归来"
              : w.phase === "memory" || w.phase === "done"
                ? "走过的道路，回到写字桌前"
                : "先学会在这里一起生活"}
          </h2>
          <p>
            保罗与这对从意大利来的同业相遇，同住同工（徒18:1–3）。具体订单、工具与对白为创作。片段压缩较长事奉，不把三份订单当作一年六个月。
          </p>
        </div>
      </div>
      {w.phase === "craft" && (
        <>
          <Stats
            items={[
              { label: "模型材料", value: w.materials },
              { label: "日用钱币", value: w.income },
              { label: "今日工作余裕", value: `${w.hours}/6` },
              { label: "身体疲劳", value: w.fatigue, danger: w.fatigue >= 60 },
              { label: "完成订单", value: `${w.completedOrders.length}/3` },
            ]}
          />
          <div className="workshop-week" aria-label="本周生活节奏">
            {["一", "二", "三", "四", "五", "六", "安息日"].map((day, i) => (
              <div key={day} className={(w.day - 1) % 7 === i ? "current" : ""}>
                <strong>{day}</strong>
                <small>{i === 6 ? "会堂片段" : "工作 · 生活"}</small>
              </div>
            ))}
          </div>
          <div className="workshop-layout">
            <section className="craft-table" aria-label="工坊制作台">
              <div className="craft-heading">
                <h3>{order ? order.title : "三份订单已完成"}</h3>
                <span>
                  {
                    {
                      layout: "量度与排料",
                      cut: "已裁切，待拼接",
                      stitched: "拼接完成，待交付",
                    }[w.stage]
                  }
                </span>
              </div>
              {order ? (
                <>
                  <p className="interaction-instruction">
                    选择裁片，再点原料的左上起点放置；支持拖放。可旋转、取回；全部排好后再裁切，不重叠、不留空。
                  </p>
                  <div
                    className="piece-tray"
                    role="group"
                    aria-label="裁片模板"
                  >
                    {order.pieces.map((piece) => (
                      <button
                        key={piece.id}
                        draggable={w.stage === "layout"}
                        aria-label={`选择裁片：${piece.name}`}
                        aria-pressed={selected === piece.id}
                        disabled={w.stage !== "layout"}
                        onDragStart={(e) => {
                          setSelected(piece.id);
                          e.dataTransfer.setData(
                            "text/plain",
                            JSON.stringify({ id: piece.id, rotated }),
                          );
                        }}
                        onClick={() => {
                          setSelected(piece.id);
                          setRotated(false);
                        }}
                      >
                        <span className={`fabric-swatch piece-${piece.id}`} />
                        {piece.name}
                        <small>
                          {piece.w}×{piece.h}
                        </small>
                        {w.placements.some((p) => p.id === piece.id) && (
                          <em>已放</em>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="craft-options">
                    <button
                      aria-pressed={rotated}
                      disabled={w.stage !== "layout"}
                      onClick={() => setRotated(!rotated)}
                    >
                      旋转所选裁片 ↻ {rotated ? "90°" : "0°"}
                    </button>
                    <button
                      disabled={w.stage !== "layout"}
                      onClick={() =>
                        dispatch({ type: "remove-piece", id: selected })
                      }
                    >
                      取回所选裁片
                    </button>
                  </div>
                  <div
                    className={`fabric-board ${w.stage !== "layout" ? "cut-fabric" : ""}`}
                    role="group"
                    aria-label="原料排料网格"
                    style={{ gridTemplateColumns: `repeat(${order.cols},1fr)` }}
                  >
                    {Array.from({ length: order.cols * order.rows }, (_, i) => {
                      const x = i % order.cols,
                        y = Math.floor(i / order.cols),
                        occupied = w.placements.find((p) =>
                          cellsFor(order, p).some(
                            (c) => c.x === x && c.y === y,
                          ),
                        );
                      return (
                        <button
                          type="button"
                          key={i}
                          className={
                            occupied ? `filled piece-${occupied.id}` : ""
                          }
                          aria-label={`原料 ${x + 1}列${y + 1}行${occupied ? `，裁片${occupied.id}` : ""}`}
                          disabled={w.stage !== "layout"}
                          onClick={() => place(x, y)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            try {
                              const p = JSON.parse(
                                e.dataTransfer.getData("text/plain"),
                              );
                              if (typeof p.id === "string")
                                place(x, y, p.id, !!p.rotated);
                            } catch {
                              /* malformed drag never changes state */
                            }
                          }}
                        >
                          {occupied ? occupied.id.toUpperCase() : "+"}
                        </button>
                      );
                    })}
                  </div>
                  <div className="craft-stages">
                    <button
                      className={w.stage === "layout" ? "primary" : ""}
                      disabled={w.stage !== "layout"}
                      onClick={() => act("cut")}
                    >
                      量好并裁切 · 2时段
                    </button>
                    <button
                      className={w.stage === "cut" ? "primary" : ""}
                      disabled={w.stage !== "cut"}
                      onClick={() => act("stitch")}
                    >
                      共用工具拼接 · 2时段
                    </button>
                    <button
                      className={w.stage === "stitched" ? "primary" : ""}
                      disabled={w.stage !== "stitched"}
                      onClick={() => act("deliver")}
                    >
                      交付订单 · 1时段
                    </button>
                  </div>
                  <p className="fiction-note">
                    裁片与原料网格是空间谜题，不是已经考证的古代帐篷样式。模型材料与钱币不是一世纪真实价格。
                  </p>
                </>
              ) : (
                <div className="chapter-resolution">
                  <h3>工作已经交接，留一点时间给人。</h3>
                  <p>
                    回顾会堂讲论，认识提多犹士都和基利司布，再看一位同工归来。
                  </p>
                </div>
              )}
            </section>
            <aside className="workshop-life">
              <h3>共同生活的安排</h3>
              <p>工作、休息与接待都需要时间。不要把一个人用尽。</p>
              <button onClick={() => act("buy")}>
                采购12材料 · 3钱币／1时段
              </button>
              {order &&
                w.income < 3 &&
                w.materials < order.cols * order.rows && (
                  <button onClick={() => act("borrow")}>
                    缺料求助：整理借用材料 · 2时段
                  </button>
                )}
              <button onClick={() => act("meal")}>共同用餐 · 1时段</button>
              <button onClick={() => act("rest")}>收工与休息 → 下一日</button>
              <button
                disabled={w.encounters.includes("Sabbath")}
                onClick={() => act("gather")}
              >
                {w.encounters.includes("Sabbath") ? "✓ " : ""}回顾安息日会堂 ·
                1时段
              </button>
              <button
                disabled={w.encounters.includes("Justus")}
                onClick={() => act("care", "Justus")}
              >
                {w.encounters.includes("Justus") ? "✓ " : ""}认识提多犹士都 ·
                1时段
              </button>
              <button
                disabled={w.encounters.includes("Crispus")}
                onClick={() => act("care", "Crispus")}
              >
                {w.encounters.includes("Crispus") ? "✓ " : ""}认识基利司布 ·
                1时段
              </button>
              <details>
                <summary>打开生活与工作记录</summary>
                {w.schedule.length ? (
                  <ol>
                    {w.schedule.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ol>
                ) : (
                  <p>完成一次用餐、休息或探访后，记录会留在这里。</p>
                )}
              </details>
              <p className="board-note">
                日程为压缩的生活片段。徒18:11记载一年六个月的教导；这里不以游戏天数替代历史时长。
              </p>
            </aside>
          </div>
        </>
      )}
      {w.phase === "report" && (
        <div className="report-scene">
          <div className="arrival-figures" aria-hidden="true">
            <i />
            <i />
          </div>
          <p className="eyebrow">从马其顿来的消息 · 徒18:5</p>
          <h2>西拉。提摩太。</h2>
          <p>先把手里的工具放下。离开的那间教会，有消息了。</p>
          <button className="primary" onClick={() => act("report")}>
            放下工具，听他们带来的消息
          </button>
          <p className="fiction-note">
            相遇的经文信息固定；工坊来客的具体镜头与对白为戏剧重建。
          </p>
        </div>
      )}
      {w.phase === "memory" && (
        <>
          <section className="memory-ribbon" aria-label="你走过的旅程">
            {state.memories.map((m) => (
              <span key={m}>◇ {m}</span>
            ))}
          </section>
          <p className="board-note">
            把旅程与书信背景相连。以下是叙事整理，感恩与关怀并非有可确定日期的独立历史步骤。你不扮演保罗撰写经文。
          </p>
          <ClueBoard
            label="旅程与书信记忆板"
            cards={MEMORIES}
            slots={MEMORY_SLOTS}
            matched={w.memories}
            onMatch={(slot, card) =>
              dispatch({ type: "memory-match", slot, card })
            }
          />
        </>
      )}
      {w.phase === "done" && (
        <div className="chapter-resolution">
          <h2>现在，你知道为什么有这封信。</h2>
          <p>离别、忍耐、查验、交流、共同劳动与好消息，汇到同一张写字桌前。</p>
        </div>
      )}
    </div>
  );
}
export function Epilogue({
  state,
  dispatch,
  onReplay,
}: Props & { onReplay: () => void }) {
  const letter = state.letter;
  if (state.letterOpen)
    return (
      <div className="chapter-play living-letter">
        <p className="eyebrow">第二篇 · THE LIVING LETTER</p>
        <h2>一封信，如何建立一间教会</h2>
        <p className="subtitle">
          你已经从旅伴，来到帖撒罗尼迦听信者的位置。前传记忆与经文记录仍在。
        </p>
        {letter.phase === "arrival" ? (
          <section className="letter-delivery">
            <div className="letter-envelope" aria-hidden="true">
              ✉
            </div>
            <h3>门口，有人带来一封信。</h3>
            <p>
              送信人的身份与路线没有记载。这里采用未具名的虚构送信人，只呈现信件来到群体的过渡。
            </p>
            <button
              className="primary"
              onClick={() => dispatch({ type: "receive-letter" })}
            >
              接过书信，进入聚会
            </button>
          </section>
        ) : (
          <>
            <div
              className="letter-index"
              role="group"
              aria-label="书信阅读导览"
            >
              {LETTER_INTRO.map((chapter, page) => (
                <button
                  aria-pressed={letter.page === page}
                  key={chapter.ref}
                  onClick={() => dispatch({ type: "read-letter", page })}
                >
                  {chapter.title}
                  {letter.heard.includes(page) ? " ✓" : ""}
                </button>
              ))}
            </div>
            <article className="reading-sheet">
              <span className="evidence-tag">经文内容概述 · 非逐字译文</span>
              <h3>{LETTER_INTRO[letter.page].title}</h3>
              <small>{LETTER_INTRO[letter.page].ref}</small>
              <p>{LETTER_INTRO[letter.page].text}</p>
              {letter.phase === "reading" && (
                <button
                  className="primary"
                  onClick={() => dispatch({ type: "read-letter", page: 0 })}
                >
                  听第一章，让关怀进入今天
                </button>
              )}
            </article>
            {letter.phase === "community" && (
              <section className="community-play" aria-label="第一章群体任务">
                <p className="eyebrow">第一章 · 信、爱、望的群体故事</p>
                <h3>三件普通的事，谁来接续？</h3>
                <p>
                  一位手艺人承受压力，一个家庭需要晚饭，一位邻舍正在悲伤。安排具体照顾，让每个人可用的时间得到尊重。人物与任务为虚构，照顾结果不代表属灵等级。
                </p>
                <div className="community-people">
                  {CARE_PEOPLE.map((person) => {
                    const used = CARE_TASKS.filter(
                      (t) => letter.assignments[t.id] === person.id,
                    ).reduce((sum, t) => sum + t.hours, 0);
                    return (
                      <div
                        className={used > person.hours ? "warning" : ""}
                        key={person.id}
                      >
                        <strong>{person.name}</strong>
                        <small>
                          已安排 {used} / 可用 {person.hours} 时段
                        </small>
                      </div>
                    );
                  })}
                </div>
                <div className="care-planner">
                  {CARE_TASKS.map((task) => (
                    <label key={task.id}>
                      {task.title} · {task.hours}时段
                      <select
                        aria-label={task.title}
                        disabled={letter.dayComplete}
                        value={letter.assignments[task.id] ?? ""}
                        onChange={(e) =>
                          dispatch({
                            type: "assign-care",
                            task: task.id,
                            person: e.target.value,
                          })
                        }
                      >
                        <option value="">选择接手的人</option>
                        {CARE_PEOPLE.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <button
                  className="primary"
                  disabled={letter.dayComplete}
                  onClick={() => dispatch({ type: "care-day" })}
                >
                  {letter.dayComplete
                    ? "✓ 今天的照顾已接续"
                    : "让今天的安排开始"}
                </button>
                {letter.dayComplete && (
                  <div className="community-outcomes">
                    <p>合作工作已经有人接下。</p>
                    <p>晚饭有人送到家门口。</p>
                    <p>悲伤中的人今晚有人陪伴。</p>
                    <small>
                      这是第二篇第一幕的可玩起点；其余章节目前提供阅读导览，完整主游戏仍待制作。
                    </small>
                  </div>
                )}
              </section>
            )}
          </>
        )}
        <button onClick={onReplay}>重游前传</button>
      </div>
    );
  return (
    <div className="chapter-play epilogue-cinematic">
      <p className="eyebrow">
        {CHAPTERS.slice(0, 6).every((c) => state.completed.includes(c.id))
          ? "前传完成 · 从午夜逃亡到第一封信"
          : "书信序幕 · 自由体验（前传尚未全部完成）"}
      </p>
      <div className="recap-track">
        {state.memories.map((m, i) => (
          <span style={{ animationDelay: `${i * 0.12}s` }} key={m}>
            {m}
          </span>
        ))}
      </div>
      <div className="writing-desk">
        <div className="letter-paper">
          <p>致帖撒罗尼迦的教会</p>
          <div className="letter-names">
            <span>保罗</span>
            <span>
              西拉 <small>Silvanus</small>
            </span>
            <span>提摩太</span>
          </div>
          <div className="ink-lines">
            <i />
            <i />
            <i />
          </div>
          <small>帖撒罗尼迦前书 1:1 · 名称与章节索引</small>
        </div>
        <div className="inkwell" aria-hidden="true" />
      </div>
      <h2>
        他们已经离开帖撒罗尼迦。
        <br />
        然而，福音的故事没有停止。
      </h2>
      <p className="fiction-note">
        哥林多的写作场景为历史重建；不指定确切日期、书吏或送信人。
      </p>
      <div className="ending-actions">
        <button
          className="primary large"
          onClick={() => dispatch({ type: "open-letter" })}
        >
          打开第一封信 →
        </button>
        <button onClick={onReplay}>重游前传</button>
      </div>
    </div>
  );
}
