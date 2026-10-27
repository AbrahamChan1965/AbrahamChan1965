import type { Campaign, CampaignAction } from "../campaign/state";
import { CHAPTERS } from "../campaign/content";
export function ModernTransfer({
  state,
  dispatch,
}: {
  state: Campaign;
  dispatch: (action: CampaignAction) => void;
}) {
  const index = CHAPTERS.findIndex((c) => c.id === state.chapter),
    modern = state.modern[state.chapter];
  const sourceMode = index === 2 || index === 3,
    dialogueMode = index === 4;
  return (
    <section className="modern-panel" aria-label="带回今天的练习">
      <p className="eyebrow">二十一世纪 · 情境迁移</p>
      <h3>
        {sourceMode
          ? index === 2
            ? "转发之前，先查证"
            : "信息不全，安排下一步"
          : dialogueMode
            ? "公共论坛：AI与人的尊严"
            : "长期照顾，需要接力"}
      </h3>
      <p>
        {sourceMode
          ? "一则消息声称有确定答案。先打开三项资料，再决定怎样处理。古今处境不同，这里练习资料判断。"
          : dialogueMode
            ? "对方说：「我希望AI减轻劳动，也担心人只被当成数据。」先听完整，再准确复述。"
            : "今天有三个时段：早上需要有人接班，下午你可照顾家人，晚上身体需要休息。把事务分担，不能由一个人承担全部。"}
      </p>
      {sourceMode ? (
        <>
          <div className="transfer-options">
            {[
              {
                id: "source",
                title: "原始出处",
                text:
                  index === 2
                    ? "出处只有截图片段，没有完整经文。"
                    : "消息只确认目的地，没有确认交通方式。",
              },
              {
                id: "context",
                title: "上下文",
                text:
                  index === 2
                    ? "完整上下文并不支持「立刻转发才有信心」的断言。"
                    : "天气与转运时间还可能变化，需要预留替代方案。",
              },
              {
                id: "reliable",
                title: "可靠资料",
                text: "独立资料尚不足以支持确定说法，继续查验比扩大传播更负责任。",
              },
            ].map((item) => (
              <div key={item.id}>
                <button
                  onClick={() =>
                    dispatch({
                      type: "modern",
                      action: "inspect",
                      value: item.id,
                    })
                  }
                >
                  {modern?.inspected.includes(item.id) ? "✓ " : ""}
                  {item.title}
                </button>
                {modern?.inspected.includes(item.id) && <p>{item.text}</p>}
              </div>
            ))}
          </div>
          <fieldset>
            <legend>你的处理方式</legend>
            {[
              { id: "forward", title: "把未经确认的断言转发出去" },
              {
                id: "hold",
                title:
                  index === 2
                    ? "暂缓转发，标记缺少的证据"
                    : "说明未知部分，保留替代计划",
              },
            ].map((o) => (
              <label key={o.id}>
                <input
                  type="radio"
                  name="modern-source"
                  checked={modern?.response === o.id}
                  onChange={() =>
                    dispatch({ type: "modern", action: "respond", value: o.id })
                  }
                />
                {o.title}
              </label>
            ))}
          </fieldset>
        </>
      ) : dialogueMode ? (
        <>
          <button
            onClick={() =>
              dispatch({ type: "modern", action: "inspect", value: "listen" })
            }
          >
            听完对方的关切
          </button>
          {modern?.inspected.includes("listen") && (
            <fieldset>
              <legend>用自己的话复述，再继续交谈</legend>
              {[
                {
                  id: "dignity",
                  text: "你欢迎工具帮助人，也关心效率不能取代人的尊严。",
                },
                {
                  id: "caricature",
                  text: "所以你反对一切技术，也不愿意工作。",
                },
              ].map((o) => (
                <label key={o.id}>
                  <input
                    type="radio"
                    name="modern-listen"
                    checked={modern?.response === o.id}
                    onChange={() =>
                      dispatch({
                        type: "modern",
                        action: "respond",
                        value: o.id,
                      })
                    }
                  />
                  {o.text}
                </label>
              ))}
            </fieldset>
          )}
        </>
      ) : (
        <div className="care-planner">
          {[
            { id: "morning", title: "早上 · 需要接班" },
            { id: "afternoon", title: "下午 · 我有时间" },
            { id: "evening", title: "晚上 · 身体需休息" },
          ].map((slot) => (
            <label key={slot.id}>
              {slot.title}
              <select
                value={modern?.plan[slot.id] ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "modern",
                    action: "plan",
                    slot: slot.id,
                    value: e.target.value,
                  })
                }
              >
                <option value="">安排一个行动</option>
                <option value="self">我来照顾</option>
                <option value="helper">请已答应的同伴接班</option>
                <option value="rest">休息</option>
              </select>
            </label>
          ))}
        </div>
      )}
      <button
        className="primary"
        onClick={() => dispatch({ type: "modern", action: "check" })}
      >
        检查安排与资料
      </button>
      {modern?.complete && (
        <p className="success" role="status">
          已形成可行回应。没有灵性积分；安排和记录保存在本机。
        </p>
      )}
    </section>
  );
}
