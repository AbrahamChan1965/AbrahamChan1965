import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { MAP, HOUSEHOLDS, PATROLS, patrolAt, same, type GameState, type Point } from '../game/engine';

export function MapBoard({ state, forecast, onTile }: { state: GameState; forecast: boolean; onTile: (p: Point) => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<import('../game/NightScene').NightScene | null>(null);
  const latest = useRef({ state, forecast });
  latest.current = { state, forecast };
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let game: Phaser.Game | undefined;
    Promise.all([import('phaser'), import('../game/NightScene')]).then(([{ default: Phaser }, { NightScene }]) => {
      if (cancelled || !mount.current) return;
      const night = new NightScene();
      scene.current = night;
      game = new Phaser.Game({
        type: Phaser.CANVAS, parent: mount.current, width: 800, height: 700,
        backgroundColor: '#111e25', scene: night, banner: false,
        audio: { noAudio: true }, fps: { target: 12, forceSetTimeOut: true },
        callbacks: { postBoot: () => { night.updateState(latest.current.state, latest.current.forecast); } },
      });
    }).catch(() => setError(true));
    return () => { cancelled = true; scene.current = null; game?.destroy(true); };
  }, []);
  useEffect(() => { scene.current?.updateState(state, forecast); }, [state, forecast]);
  const names = { wall: '石墙', street: '街道', alley: '暗巷', shelter: '接应院落', house: '住户', start: '出发点', exit: '城外接应点' };
  return <div className="board-wrap">
    <div className="column-markers" aria-hidden="true">{'ABCDEFGH'.split('').map(c => <span key={c}>{c}</span>)}</div>
    <div className="board">
      <div className="phaser-mount" ref={mount} aria-hidden="true" />
      <div className="row-markers" aria-hidden="true">{[1, 2, 3, 4, 5, 6, 7].map(n => <span key={n}>{n}</span>)}</div>
      {error && <div className="render-error">地图画面载入失败。请刷新页面；下方的文字地图与方向键仍可操作。</div>}
      <div className={`tile-grid ${error ? 'fallback-grid' : ''}`} role="group" aria-label="街巷地图，8列7行。点击相邻格移动，点击脚下的住户进行联络。">
        {MAP.flatMap((row, y) => row.map((tile, x) => {
          const p = { x, y };
          const house = HOUSEHOLDS.find(h => same(h.position, p));
          const guard = PATROLS.findIndex((_, i) => same(patrolAt(i, state.turn).position, p));
          const player = same(state.position, p);
          const name = `${String.fromCharCode(65 + x)}${y + 1} ${house?.name ?? names[tile]}${player ? '，你在这里' : ''}${guard >= 0 ? '，巡查在这里' : ''}`;
          return <button type="button" key={`${x}-${y}`} className={`tile-hit tile-${tile} ${player ? 'player-tile' : ''}`} aria-label={name} title={name}
            onClick={() => onTile(p)} disabled={tile === 'wall' || state.status !== 'playing'}>
            <span className={error ? '' : 'sr-only'}>{player ? '你 · ' : ''}{house?.name ?? names[tile]}{guard >= 0 ? ' · 巡查' : ''}</span>
          </button>;
        }))}
      </div>
    </div>
    <div className="map-caption"><span>帖撒罗尼迦 · 街巷示意</span><span>创作地图 / 非考古复原</span></div>
  </div>;
}
