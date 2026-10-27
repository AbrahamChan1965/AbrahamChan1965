import { useCallback, useEffect, useState } from "react";
import NightEscape from "../App";
import { type GameState } from "../game/engine";
import { decodeSave, SAVE_KEY, writeSave } from "../game/save";
import { CHAPTERS, STUDY, LEVELS, type ChapterId } from "./content";
import {
  captureEscape,
  campaignStep,
  canContinue,
  replayChapter,
  replayPrologue,
  type CampaignAction,
} from "./state";
import { readCampaign, writeCampaign } from "./save";
import {
  RoadChapter,
  BereaChapter,
  CoastChapter,
  AthensChapter,
  WorkshopChapter,
  Epilogue,
} from "./chapters";
import { Dialog } from "../ui/Dialog";
import { ModernTransfer } from "../ui/ModernTransfer";
import { NightAudio } from "../game/audio";
import { WorldMap } from "./WorldMap";
import "./prologue.css";

type Panel = "journey" | "journal" | "modern" | "replay" | null;
export default function Prologue() {
  const [state, setState] = useState(() => {
    const loaded = readCampaign();
    try {
      if (loaded.escape && !decodeSave(localStorage.getItem(SAVE_KEY)))
        writeSave(loaded.escape);
    } catch {
      /* storage warning handled below */
    }
    return loaded;
  });
  const [panel, setPanel] = useState<Panel>(null),
    [target, setTarget] = useState<ChapterId>("CH01_MIDNIGHT_ESCAPE");
  const [saved, setSaved] = useState(true),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const [nightKey, setNightKey] = useState(0),
    [audio] = useState(() => new NightAudio()),
    [sound, setSound] = useState(false);
  const dispatch = useCallback((action: CampaignAction) => {
    setState((previous) => campaignStep(previous, action));
  }, []);
  const completedEscape = useCallback((escape: GameState) => {
    setState((previous) => captureEscape(previous, escape));
  }, []);
  useEffect(() => {
    setSaved(writeCampaign(state));
  }, [state]);
  useEffect(() => {
    if (sound)
      audio.tick(
        state.chapter === "CH03_BEREA_CRISIS" && state.berea.phase === "crisis"
          ? 82
          : state.chapter === "CH06_CORINTH_WORKSHOP"
            ? 138
            : 110,
      );
  }, [state.revision, sound, audio]);
  const chapter = CHAPTERS.find((c) => c.id === state.chapter)!,
    index = CHAPTERS.findIndex((c) => c.id === state.chapter);
  const [replayingAll, setReplayingAll] = useState(false);
  const replay = (id: ChapterId, all = false) => {
    setReplayingAll(all);
    setTarget(id);
    setPanel("replay");
  };
  const beginReplay = () => {
    const next = replayingAll
      ? replayPrologue(state)
      : replayChapter(state, target);
    if (target === "CH01_MIDNIGHT_ESCAPE" && next.escape) {
      writeSave(next.escape);
      setNightKey((v) => v + 1);
    }
    setState(next);
    setPanel(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const continueChapter = () => {
    dispatch({ type: "continue" });
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const night = state.chapter === "CH01_MIDNIGHT_ESCAPE";
  return (
    <>
      {night ? (
        <NightEscape
          key={nightKey}
          onComplete={completedEscape}
          onCampaign={() => setPanel("journey")}
          onContinue={(escape) => {
            setState((previous) =>
              campaignStep(captureEscape(previous, escape), {
                type: "continue",
              }),
            );
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        />
      ) : (
        <div className={`app campaign ${reduced ? "reduced-motion" : ""}`}>
          <header className="site-header">
            <button
              className="brand brand-button"
              onClick={() => setPanel("journey")}
            >
              <span className="brand-mark" aria-hidden="true">
                道
              </span>
              <span>
                道路与书信<small>从午夜逃亡到第一封信</small>
              </span>
            </button>
            <nav aria-label="前传工具">
              <button onClick={() => setPanel("journey")}>旅程地图</button>
              <button onClick={() => setPanel("journal")}>经文与记忆</button>
              <button
                aria-label={sound ? "关闭前传音效" : "开启前传音效"}
                aria-pressed={sound}
                onClick={async () => {
                  setSound(await audio.toggle());
                }}
              >
                {sound ? "♫" : "♪"}
              </button>
            </nav>
          </header>
          <main id="campaign-main">
            <div className="chapter-header">
              <div>
                <p className="eyebrow">
                  <span className="gold-rule" />{" "}
                  {state.letterOpen
                    ? "第二篇 · 一封信，如何建立一间教会"
                    : `前传 · ${String(index + 1).padStart(2, "0")} / 07`}
                </p>
                <h1>
                  {state.letterOpen ? "THE LIVING LETTER" : chapter.title}
                </h1>
                <p className="subtitle">{chapter.subtitle}</p>
              </div>
              <div className="chapter-stamp">
                <span className="moon">{chapter.icon}</span>
                <span>
                  {chapter.location}
                  <small>{chapter.ref}</small>
                </span>
              </div>
            </div>
            <div className="campaign-progress" aria-label="前传章节进度">
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.id}
                  aria-current={c.id === state.chapter ? "step" : undefined}
                  disabled={
                    c.id !== state.chapter && !state.completed.includes(c.id)
                  }
                  onClick={() => c.id !== state.chapter && replay(c.id)}
                >
                  <span>{state.completed.includes(c.id) ? "✓" : i + 1}</span>
                  <small>{c.location}</small>
                </button>
              ))}
            </div>
            {state.chapter === "CH02_78KM_ROAD" && (
              <RoadChapter state={state} dispatch={dispatch} />
            )}
            {state.chapter === "CH03_BEREA_CRISIS" && (
              <BereaChapter
                state={state}
                dispatch={dispatch}
                paused={!!panel}
              />
            )}
            {state.chapter === "CH04_COASTAL_EVACUATION" && (
              <CoastChapter state={state} dispatch={dispatch} />
            )}
            {state.chapter === "CH05_ATHENS" && (
              <AthensChapter
                state={state}
                dispatch={dispatch}
                paused={!!panel}
              />
            )}
            {state.chapter === "CH06_CORINTH_WORKSHOP" && (
              <WorkshopChapter state={state} dispatch={dispatch} />
            )}
            {state.chapter === "EPILOGUE_FIRST_LETTER" && (
              <Epilogue
                state={state}
                dispatch={dispatch}
                onReplay={() => replay("CH01_MIDNIGHT_ESCAPE", true)}
              />
            )}
            <section className="campaign-log" aria-label="当前旅程反馈">
              <p className="eyebrow">旅程记录</p>
              <p
                role="status"
                aria-live="polite"
                data-testid="campaign-feedback"
              >
                {state.log.at(-1)}
              </p>
            </section>
            {canContinue(state) && (
              <div className="chapter-finish">
                <button className="primary large" onClick={continueChapter}>
                  继续：{CHAPTERS[index + 1].title} →
                </button>
                <button onClick={() => setPanel("modern")}>
                  停一停 · 带回今天
                </button>
              </div>
            )}
            <footer className="game-footer">
              <span className={saved ? "" : "save-warning"}>
                {saved
                  ? "◌ 前传进度自动保存在本机"
                  : "本机存储不可用，关闭页面会丢失当前进度"}
              </span>
              <div>
                <button onClick={() => setPanel("modern")}>带回今天</button>
                <button
                  onClick={() => setReduced(!reduced)}
                  aria-pressed={reduced}
                >
                  减少动态{reduced ? " ✓" : ""}
                </button>
                <button onClick={() => replay(state.chapter)}>重游本章</button>
              </div>
            </footer>
          </main>
        </div>
      )}
      {panel === "journey" && (
        <Dialog
          title="从午夜逃亡到第一封信"
          wide
          onClose={() => setPanel(null)}
        >
          <WorldMap current={state.chapter} />
          <p className="fiction-note">
            地点顺序以徒17–18为骨架。地标、交通与行囊任务为重建；海陆细节未详。
          </p>
          <div className="journey-chapter-list">
            {CHAPTERS.map((c, i) => (
              <button
                key={c.id}
                disabled={
                  !state.completed.includes(c.id) && c.id !== state.chapter
                }
                onClick={() =>
                  c.id === state.chapter ? setPanel(null) : replay(c.id)
                }
              >
                <span>
                  {state.completed.includes(c.id) ? "✓" : `0${i + 1}`}
                </span>
                <div>
                  <strong>{c.title}</strong>
                  <small>
                    {c.ref} ·{" "}
                    {c.id === state.chapter
                      ? "当前章节"
                      : state.completed.includes(c.id)
                        ? "可重游"
                        : "沿主线逐步到达"}
                  </small>
                </div>
              </button>
            ))}
          </div>
          <button className="primary" onClick={() => setPanel("journal")}>
            查看经文与旅程记忆
          </button>
          <button onClick={() => setPanel("modern")}>带回今天的情境</button>
        </Dialog>
      )}
      {panel === "journal" && (
        <Dialog
          title="经文、历史与旅程记忆"
          wide
          onClose={() => setPanel(null)}
        >
          <p>
            经文随时开放。以下为原创概述与章节索引，不是逐字译文；发现记录不衡量灵命。
          </p>
          <div className="memory-ribbon">
            {state.memories.length ? (
              state.memories.map((m) => <span key={m}>◇ {m}</span>)
            ) : (
              <span>旅程刚刚开始。已有的夜逃进度仍保存在原存档。</span>
            )}
          </div>
          <div className="journal-list">
            {STUDY.map((s) => (
              <article key={s.ref}>
                <span
                  className={`evidence-tag ${s.level === "SCHOLARLY_UNCERTAIN" ? "uncertain-tag" : ""}`}
                >
                  {LEVELS[s.level]}
                </span>
                <h3>{s.ref}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
          <details>
            <summary>已经建立的经文关联</summary>
            <ul>
              {state.journal.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </details>
          <details>
            <summary>旅程日志</summary>
            <ol>
              {state.log.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </details>
          <button className="primary" onClick={() => setPanel(null)}>
            回到旅程
          </button>
        </Dialog>
      )}
      {panel === "modern" && (
        <Dialog title="把所学带回今天" wide onClose={() => setPanel(null)}>
          <ModernTransfer state={state} dispatch={dispatch} />
          <p role="status">{state.log.at(-1)}</p>
          <button onClick={() => setPanel(null)}>回到游戏</button>
        </Dialog>
      )}
      {panel === "replay" && (
        <Dialog
          title={
            replayingAll
              ? "重游整个前传"
              : `重游：${CHAPTERS.find((c) => c.id === target)!.title}`
          }
          onClose={() => setPanel(null)}
        >
          <p>
            {replayingAll
              ? "本轮所有关卡的操作进度重新开始；已发现经文、旅程记忆与个人反思保留。"
              : "本章的操作进度会重新开始。其他章节的完成记录、旅程记忆与个人反思保留。"}
            重游不会增加灵性或成就积分。
          </p>
          <div className="ending-actions">
            <button className="primary" onClick={beginReplay}>
              确认重游
            </button>
            <button onClick={() => setPanel(null)}>保留当前进度</button>
          </div>
        </Dialog>
      )}
    </>
  );
}
