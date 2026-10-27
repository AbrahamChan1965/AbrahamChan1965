import { useEffect, useRef, useState, type ReactNode } from 'react';
import { freshGame, step, recover, same, distance, tileAt, patrolAt, PATROLS, HOUSEHOLDS, SHELTER, EXIT, availableInteraction, planRoute, type Action, type Direction, type Point, type GameState } from './game/engine';
import { readSave, writeSave, decodeSave, SAVE_KEY } from './game/save';
import { NightAudio } from './game/audio';
import { chapter, communityOutcome, evidenceLabels } from './narrative/content';
import { references } from './scripture/references';
import { MapBoard } from './ui/MapBoard';
import { Dialog } from './ui/Dialog';

type Panel = 'intro' | 'journal' | 'help' | 'restart' | null;
function hasSave() { try { return !!decodeSave(localStorage.getItem(SAVE_KEY)); } catch { return false; } }
const directionNames: Record<Direction, string> = { up: '向上移动', down: '向下移动', left: '向左移动', right: '向右移动' };
const directionArrows: Record<Direction, string> = { up: '↑', down: '↓', left: '←', right: '→' };

export default function App({ onContinue, onComplete, onCampaign, navigation, initialState }: { navigation?: (state: GameState) => ReactNode; initialState?: GameState; onContinue?: (state: GameState) => void; onComplete?: (state: GameState) => void; onCampaign?: (state: GameState) => void } = {}) {
  const [state, setState] = useState(() => initialState ?? readSave());
  const [panel, setPanel] = useState<Panel>(() => initialState || hasSave() ? null : 'intro');
  const [forecast, setForecast] = useState(true);
  const [saved, setSaved] = useState(true);
  const [sound, setSound] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hint, setHint] = useState('');
  const [notice, setNotice] = useState('');
  const [reflection, setReflection] = useState(() => { try { return localStorage.getItem('road-reflection') ?? ''; } catch { return ''; } });
  const audio = useRef(new NightAudio());
  const stateRef = useRef(state); stateRef.current = state;
  const panelRef = useRef(panel); panelRef.current = panel;
  useEffect(() => { if (panel !== 'intro') setSaved(writeSave(state)); }, [state, panel]);
  useEffect(() => { if (state.status === 'escaped') onComplete?.(state); }, [state, onComplete]);
  function act(action: Action) {
    if (panelRef.current || stateRef.current.status !== 'playing') return;
    setHint(''); setNotice('');
    setState(previous => step(previous, action));
    audio.current.tick();
  }
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current || stateRef.current.status !== 'playing' || target.closest('input, textarea, select, dialog, a, [contenteditable]')) return;
      const keys: Record<string, Direction> = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
      if (keys[e.key]) { e.preventDefault(); act({ type: 'move', direction: keys[e.key] }); }
      else if (e.key === ' ' && !target.closest('button')) { e.preventDefault(); act({ type: 'wait' }); }
      else if (e.key.toLowerCase() === 'e' && !target.closest('button')) { e.preventDefault(); act({ type: 'interact' }); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  function onTile(p: Point) {
    if (same(p, state.position)) { act({ type: 'interact' }); return; }
    if (distance(p, state.position) !== 1) { setNotice('每次只能走相邻一格。先观察金色标记，规划下一步。'); return; }
    const direction = p.x > state.position.x ? 'right' : p.x < state.position.x ? 'left' : p.y > state.position.y ? 'down' : 'up';
    act({ type: 'move', direction });
  }
  function showHint() {
    const nextHouse = HOUSEHOLDS.find(h => !state.contacts.includes(h.id));
    const target = nextHouse?.position ?? EXIT;
    const route = planRoute(state, target, !!nextHouse);
    const first = route?.[0];
    const text = first?.type === 'move' ? directionNames[first.direction] : first?.type === 'wait' ? '等待一回合' : first?.type === 'interact' ? '进行联络' : '已经抵达目的地';
    setHint(route ? `前往${nextHouse?.name ?? '城外接应点'}：下一步${text}。这是当前巡查节奏下的一条安全路线。` : '当前暂未找到安全路线。可从最近接应点重试。');
  }
  const interaction = availableInteraction(state);
  const concealed = ['shelter', 'alley'].includes(tileAt(state.position));
  const outcome = communityOutcome(state.contacts);
  return <div className={`app ${reduced ? 'reduced-motion' : ''}`}>
    <header className="site-header">
      <a href="#main" className="brand"><span className="brand-mark" aria-hidden="true">道</span><span>道路与书信<small>THE ROAD & THE LETTERS</small></span></a>
      <nav aria-label="游戏工具">
        <button onClick={() => setPanel('journal')}><span aria-hidden="true">▤</span> 经文手记</button>
        <button className="icon-button" aria-label={sound ? '关闭音效' : '开启音效'} aria-pressed={sound} onClick={async () => setSound(await audio.current.toggle())}>{sound ? '♫' : '♪'}<span className="sound-label">{sound ? '音效开' : '音效关'}</span></button>
        <button className="icon-button help-button" onClick={() => setPanel('help')} aria-label="玩法说明">?</button>
      </nav>
    </header>

    <main id="main">
      {navigation?.(state)}
      <div className="chapter-header">
        <div><p className="eyebrow"><span className="gold-rule" /> 第一幕 · 道路上的福音 <span className="chapter-number">/ 04</span></p><h1>{chapter.title}</h1><p className="subtitle">{chapter.subtitle}</p></div>
        <div className="chapter-stamp"><span className="moon" aria-hidden="true">☾</span><span>马其顿 · 深夜<small>使徒行传 17:5–10</small></span></div>
      </div>

      {state.status === 'escaped' ? <section className="epilogue" aria-label="离城之后">
        <div className="ending-icon" aria-hidden="true">✧</div><p className="eyebrow">抵达接应点 · 故事仍在继续</p><h2>{outcome.title}</h2>
        <p className="canonical-event">经文明载：弟兄们趁夜送保罗和西拉往庇哩亚去。<span>使徒行传 17:10</span></p>
        <div className="community-network" aria-label="城内联络结果">
          <div className="network-person">你<small>城外接应点</small></div><span className="network-line">托付 →</span>
          {HOUSEHOLDS.map(h => <div key={h.id} className={`network-person ${state.contacts.includes(h.id) ? 'connected' : ''}`}>{h.name}<small>{state.contacts.includes(h.id) ? '已接下托付' : '本次未联络'}</small></div>)}
        </div>
        <div className="ending-lines">{outcome.lines.map((line, i) => <p key={line}><span>0{i + 1}</span>{line}</p>)}</div>
        <p className="fiction-note">以上家庭与照顾行动为创作虚构，并非经文记载的当晚细节。</p>
        <div className="scripture-echo"><p className="eyebrow">后来，一封书信回望这座城</p><h3>福音从他们那里传扬出去。</h3><p>帖撒罗尼迦前书 1:6–8 描绘了患难中领受真道、成为榜样的群体。宣教者被迫离开，并没有使教会的生命停止。</p><button className="text-button" onClick={() => setPanel('journal')}>打开经文与证据说明 ↗</button></div>
        <div className="reflection"><label htmlFor="reflection">回到今天 · 如果我暂时离开，谁可以接续一件照顾人的事？</label><textarea id="reflection" value={reflection} placeholder="写下一个人、一件可以交托的事……（仅保存在本机）" onChange={e => { const value = e.target.value; setReflection(value); try { localStorage.setItem('road-reflection', value); } catch { setSaved(false); } }} /></div>
        {onContinue && <div className="prologue-continuation"><p className="eyebrow">新的旅程记录</p><p>你已经离开帖撒罗尼迦，但关于这间教会的故事尚未结束。</p><blockquote>「我们才刚开始认识这里的弟兄姐妹，就要这样离开吗？」</blockquote><p><strong>保罗（创作对白）：</strong>「我们离开了他们，却仍然盼望再见。把眼前的路走下去，也记住留在城里的人。」</p><small>同行者对白与保罗心境的呈现为创作重建，依据帖前2:17–20，不是徒17原话。</small><h3>城门已经在后面。<br />前往庇哩亚的道路，却还在黑暗中。</h3><button className="primary large" onClick={() => onContinue(state)}>前往庇哩亚 →</button></div>}
        <div className="ending-actions"><button onClick={() => setPanel('restart')}>重走这段夜路 ↻</button><button onClick={() => setPanel('journal')}>阅读经文手记</button></div>
      </section> : <div className="game-layout">
        <section className="map-panel" aria-label="战术地图">
          <div className="panel-top"><span><i className="status-dot" /> 夜行地图</span><span className="turn-counter" data-testid="turn">回合 <strong>{String(state.turn).padStart(2, '0')}</strong></span></div>
          {state.status === 'caught' && <div className="capture-banner" role="alert"><strong>被巡查发现了。可以重新规划。</strong><button onClick={() => { setState(recover(state)); setHint(''); }}>从接应点重试 ↻</button></div>}
          <MapBoard state={state} forecast={forecast} onTile={onTile} />
          <div className="map-legend"><span><i className="legend-dot player" />你</span><span><i className="legend-dot guard" />巡查 / 当前视线</span><span><i className="legend-dot future" />下一回合</span><span><i className="legend-dot shelter" />遮蔽院落</span></div>
          <label className="forecast-toggle"><input type="checkbox" checked={forecast} onChange={e => setForecast(e.target.checked)} /> 显示巡查下一步与视线 <span>没有实时倒计时，慢慢规划。</span></label>
        </section>

        <aside className="mission-sidebar">
          <section className="mission-card"><p className="eyebrow">今夜的托付</p><h2>离开，但不切断联络。</h2><p>你是一位本地同工。穿过街巷，到东北角的接应点会合。</p>
            <div className="objective main-objective"><span className="objective-icon">↗</span><div><strong>抵达城外接应点</strong><small>H1 · 通往庇哩亚的方向</small></div><span className="tag">主目标</span></div>
            <div className="optional-heading">途中可以做的事 <span>可选，不影响经文结局</span></div>
            {HOUSEHOLDS.map(h => <div className={`objective ${state.contacts.includes(h.id) ? 'done' : ''}`} key={h.id}><span className="objective-icon">{state.contacts.includes(h.id) ? '✓' : '◇'}</span><div><strong>联络{h.name}</strong><small>{h.id === 'weaver' ? 'B2 · 交托接济的消息' : 'G5 · 交托明日的探访'}</small></div></div>)}
            <p className="mission-note">你无法把所有事带走。也许留下的人，可以彼此接续。</p>
          </section>

          <section className="controls-card" aria-label="行动控制">
            <div className="control-heading"><h3>下一步，由你决定</h3><span className={concealed ? 'position-badge safe' : 'position-badge'}>{concealed ? '遮蔽中' : '街巷中'} · {String.fromCharCode(65 + state.position.x)}{state.position.y + 1}</span></div>
            <div className="controls-row"><div className="dpad">{(['up', 'left', 'down', 'right'] as Direction[]).map(direction => <button key={direction} className={`direction ${direction}`} aria-label={directionNames[direction]} onClick={() => act({ type: 'move', direction })} disabled={state.status !== 'playing'}>{directionArrows[direction]}</button>)}</div>
              <div className="action-buttons"><button onClick={() => act({ type: 'wait' })} disabled={state.status !== 'playing'}>◷ 等待一回合 <kbd>空格</kbd></button><button className={interaction && interaction !== '已完成托付' ? 'interact active' : 'interact'} onClick={() => act({ type: 'interact' })} disabled={!interaction || interaction === '已完成托付' || state.status !== 'playing'}>{interaction ?? '到住户 / 院落互动'} <kbd>E</kbd></button></div>
            </div><p className="control-tip">方向键 / WASD 移动 · 也可点击相邻地格</p>
            <button className="text-button hint-button" onClick={showHint} disabled={state.status !== 'playing'}>需要时，查看一步路线提示 ↗</button>
            {(hint || notice) && <p className="hint" role="status">{hint || notice}</p>}
          </section>

          <section className="patrol-card"><div className="control-heading"><h3>听见街上的脚步</h3><span>固定路线</span></div>{PATROLS.map((p, i) => {
            const guard = patrolAt(i, state.turn);
            return <div className="patrol-row" key={p.name}><span className="patrol-symbol">♜</span><div><strong>{p.name}</strong><small>{String.fromCharCode(65 + guard.position.x)}{guard.position.y + 1} → {String.fromCharCode(65 + guard.next.x)}{guard.next.y + 1}</small></div><span className="patrol-cycle">{p.route.length} 回合一循环</span></div>;
          })}<details className="patrol-routes"><summary>查看完整巡查路线</summary>{PATROLS.map(p => <p key={p.name}>{p.name}：{p.route.map(point => `${String.fromCharCode(65 + point.x)}${point.y + 1}`).join(' → ')} → 循环</p>)}</details><p>每次有效行动后巡查移动一格，再检查视线。墙会挡住视线；不要走进巡查当前所在格。</p></section>
        </aside>
        <section className={`event-panel ${state.status === 'caught' ? 'caught' : ''}`} aria-label="夜行记录"><div><p className="eyebrow">{state.status === 'caught' ? '暂时受阻 · 可以重来' : '夜行记录'}</p><p aria-live="polite" data-testid="latest-event">{state.events.at(-1)}</p>{state.status === 'caught' && <button className="primary" onClick={() => { setState(recover(state)); setHint(''); }}>从最近接应点重试 ↻</button>}</div><span className="record-symbol" aria-hidden="true">{state.status === 'caught' ? '↻' : '✧'}</span></section>
      </div>}
      <footer className="game-footer"><span className={saved ? '' : 'save-warning'}>{saved ? '◌ 进度自动保存在此浏览器' : '存储不可用，请勿关闭本页；当前仍可继续玩。'}</span><div>{onCampaign && <button onClick={() => onCampaign(state)}>前传旅程与记忆</button>}<button onClick={() => setReduced(!reduced)} aria-pressed={reduced}>{reduced ? '✓ 减少动态' : '减少动态'}</button><button onClick={() => setPanel('restart')}>重新开始</button><span>可玩前传 · 03</span></div></footer>
    </main>

    {panel === 'intro' && <Dialog title={chapter.title} onClose={() => setPanel(null)} wide><p className="intro-lead">{chapter.subtitle}</p><p>{chapter.intro}</p><div className="intro-rules"><div><span>01</span><strong>观察，再行动</strong><p>每次走一格。巡查按固定路线移动，金色标记预告下一回合。没有实时倒计时。</p></div><div><span>02</span><strong>在路上留下托付</strong><p>到两户人家脚下按「联络」。到紫色院落互动，可保存一个重试点。</p></div><div><span>03</span><strong>离开之后，再看一眼</strong><p>抵达右上角接应点。宣教者离城是固定事件，你的托付会改变虚构家庭的后续。</p></div></div><p className="fiction-note">保罗与西拉夜往庇哩亚：经文明载。你的角色、巡查、地图与家庭：创作虚构。没有信心、恩典或圣灵能力分数。</p><button className="primary large" onClick={() => setPanel(null)}>进入街巷 <span>→</span></button>{onCampaign && <button onClick={() => { setPanel(null); onCampaign(state); }}>先选择一个场景玩</button>}<p className="intro-footnote">约 5–10 分钟 · 键盘 / 触控 · 无需账号</p></Dialog>}

    {panel === 'journal' && <Dialog title="经文手记" onClose={() => setPanel(null)} wide><p>经文始终开放，无需收集或答题解锁。以下为内容概述与章节索引，并非逐字引用某一译本。</p><div className="journal-list">{references.map(r => <article key={r.ref}><span className="evidence-tag">{evidenceLabels[r.level]}</span><h3>{r.ref}</h3><p>{r.note}</p></article>)}</div><article className="journal-note"><span className="evidence-tag fiction">创作虚构</span><h3>我们添加了哪些细节？</h3><p>玩家同工、两户人家、具体街巷、巡查、接应记号和家庭联络都是玩法创作。巡查代表本关虚构的街巷压力，不代表某个族群或宗教身份。</p><span className="evidence-tag">历史重建</span><p>夜间街道与院落的视觉意象仅用于氛围，并非帖撒罗尼迦的考古平面复原。本关不建立精确年代，不涉及《帖撒罗尼迦后书》的作者与成书日期争议。</p></article><h3>这次夜行的记录</h3><ol className="event-history">{state.events.map((event, i) => <li key={i}>{event}</li>)}</ol><button className="primary" onClick={() => setPanel(null)}>回到夜路</button></Dialog>}

    {panel === 'help' && <Dialog title="怎样走过这段夜路" onClose={() => setPanel(null)}><ul className="help-list"><li>方向键、WASD、屏幕箭头，或点击相邻地格移动。一次一格，不能穿墙。</li><li>有效移动、等待、联络与保存接应点各用一回合。巡查先移动，再检测你；踏入巡查原位置也会被发现。</li><li>巡查只看面朝方向的直线三格，墙会遮断视线。红棕色表示当前视线，金色边角表示下一回合视线，金色圆环表示巡查下一步。</li><li>紫色院落遮蔽视线；暗巷只在距离超过一格时遮蔽。与巡查同格始终会被发现。</li><li>到 B2 / G5 按 E 或联络按钮，托付给住户。到 D4 紫色院落互动可保存重试点；重试会恢复当时的联络与巡查状态。</li><li>抵达 H1 即完成逃亡。两户联络是可选支线，没有灵性评分，也没有现实时间限制。</li></ul><button onClick={showHint} className="primary">计算下一步提示</button>{hint && <p className="hint">{hint}</p>}<button className="text-button" onClick={() => setPanel(null)}>回到游戏 →</button></Dialog>}

    {panel === 'restart' && <Dialog title="重走这段夜路？" onClose={() => setPanel(null)}><p>本次路线和联络进度会重置。你的个人反思会保留。</p><div className="ending-actions"><button className="primary" onClick={() => { setState(freshGame()); setPanel(null); setHint(''); setNotice(''); }}>重新开始</button><button onClick={() => setPanel(null)}>继续当前进度</button></div></Dialog>}
  </div>;
}
