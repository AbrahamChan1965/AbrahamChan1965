import Phaser from 'phaser';
import { MAP, PATROLS, patrolAt, vision, same, type GameState } from './engine';

// Original vector art. No image downloads, external fonts or licensed asset dependency.
export class NightScene extends Phaser.Scene {
  private snapshot?: GameState;
  private forecast = true;
  constructor() { super('NightStreet'); }
  create() { this.paint(); }
  updateState(state: GameState, forecast: boolean) {
    this.snapshot = state;
    this.forecast = forecast;
    if (this.sys.isActive()) this.paint();
  }
  private paint() {
    this.children.removeAll(true);
    const g = this.add.graphics();
    g.fillStyle(0x111e25).fillRect(0, 0, 800, 700);
    const label = (x: number, y: number, text: string, color = '#a8b5b8', size = 18) => this.add.text(x, y, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: `${size}px`, color,
    }).setOrigin(0.5);
    MAP.forEach((row, y) => row.forEach((tile, x) => {
      const px = x * 100, py = y * 100;
      if (tile === 'wall') {
        g.fillStyle(0x26343b).fillRoundedRect(px + 4, py + 4, 92, 92, 5);
        g.fillStyle(0x33434a).fillRoundedRect(px + 5, py + 4, 90, 13, 3);
        g.lineStyle(1, 0x435158, 0.45);
        for (let n = 1; n < 4; n++) {
          g.lineBetween(px + 7, py + n * 23, px + 93, py + n * 23);
          const shift = n % 2 ? 33 : 60;
          g.lineBetween(px + shift, py + n * 23, px + shift, py + n * 23 + 21);
        }
        return;
      }
      g.fillStyle((x + y) % 2 ? 0x172931 : 0x1a2d34).fillRoundedRect(px + 3, py + 3, 94, 94, 4);
      g.lineStyle(1, 0x30414a, 0.65).strokeRoundedRect(px + 3, py + 3, 94, 94, 4);
      // Worn paving, deliberately quiet so silhouettes stay legible.
      g.lineStyle(1, 0x526068, 0.15).lineBetween(px + 20, py + 30, px + 46, py + 30);
      g.lineBetween(px + 60, py + 70, px + 83, py + 70);
      if (tile === 'alley') {
        g.fillStyle(0x101d24, 0.9).fillRoundedRect(px + 7, py + 7, 86, 86, 5);
        g.lineStyle(2, 0x6c8390, 0.4).lineBetween(px + 17, py + 18, px + 17, py + 60);
        label(px + 50, py + 76, '暗巷', '#93a8b3', 16);
      }
      if (tile === 'house') {
        g.fillStyle(0xdab57c, 0.045).fillCircle(px + 50, py + 44, 48);
        g.fillStyle(0xdab57c, 0.07).fillCircle(px + 50, py + 44, 38);
        g.fillStyle(0x816448).fillRoundedRect(px + 23, py + 28, 54, 40, 3);
        g.fillStyle(0xa18459).fillRect(px + 19, py + 24, 62, 9);
        g.fillStyle(0x26313b).fillRect(px + 35, py + 43, 17, 25);
        g.fillStyle(0xf3c986).fillRect(px + 59, py + 41, 9, 12);
        label(px + 50, py + 83, x === 1 ? '织工' : '烘饼', '#dfc49a', 17);
        const id = x === 1 ? 'weaver' : 'baker';
        if (this.snapshot?.contacts.includes(id)) label(px + 82, py + 17, '✓', '#9ec9b7', 24);
      }
      if (tile === 'shelter') {
        g.fillStyle(0x8b79a4, 0.17).fillRoundedRect(px + 12, py + 12, 76, 76, 7);
        g.lineStyle(2, 0xa99abe, 0.7).strokeRoundedRect(px + 20, py + 20, 60, 48, 20);
        label(px + 50, py + 43, '◇', '#d7c2e8', 30);
        label(px + 50, py + 83, '接应院落', '#c4b4d5', 15);
      }
      if (tile === 'start') {
        label(px + 50, py + 77, '出发', '#7a9a9a', 17);
        g.lineStyle(2, 0x6c8a8e, 0.6).strokeCircle(px + 50, py + 43, 21);
      }
      if (tile === 'exit') {
        g.fillStyle(0xc6ac78, 0.15).fillRoundedRect(px + 12, py + 9, 76, 80, 6);
        g.lineStyle(3, 0xcbb27f).strokeRoundedRect(px + 28, py + 16, 44, 46, 18);
        g.lineStyle(3, 0xf1d9a6).lineBetween(px + 40, py + 48, px + 61, py + 28);
        g.lineBetween(px + 61, py + 28, px + 46, py + 28);
        g.lineBetween(px + 61, py + 28, px + 61, py + 43);
        label(px + 50, py + 82, '往庇哩亚', '#dbc494', 15);
      }
    }));
    const state = this.snapshot;
    if (!state) return;
    PATROLS.forEach((_, i) => {
      const guard = patrolAt(i, state.turn);
      const sight = vision(i, state.turn);
      sight.forEach(p => {
        if (MAP[p.y][p.x] === 'shelter') return;
        g.fillStyle(0xc9896d, 0.13).fillRoundedRect(p.x * 100 + 5, p.y * 100 + 5, 90, 90, 4);
        g.lineStyle(1, 0xc9896d, 0.3).strokeRoundedRect(p.x * 100 + 7, p.y * 100 + 7, 86, 86, 3);
      });
      if (this.forecast) {
        const nextSight = vision(i, state.turn + 1);
        nextSight.forEach(p => {
          if (MAP[p.y][p.x] === 'shelter') return;
          g.lineStyle(2, 0xddc08b, 0.6);
          const ax = p.x * 100 + 12, ay = p.y * 100 + 12;
          g.lineBetween(ax, ay + 15, ax, ay); g.lineBetween(ax, ay, ax + 15, ay);
          g.lineBetween(ax + 76, ay + 61, ax + 76, ay + 76); g.lineBetween(ax + 76, ay + 76, ax + 61, ay + 76);
        });
        const nx = guard.next.x * 100 + 50, ny = guard.next.y * 100 + 50;
        g.lineStyle(2, 0xe4c68b, 0.85).strokeCircle(nx, ny, 17);
        label(nx, ny, '·', '#e4c68b', 26);
      }
      const x = guard.position.x * 100 + 50, y = guard.position.y * 100 + 46;
      g.fillStyle(0x060d12, 0.5).fillEllipse(x + 1, y + 21, 42, 14);
      g.fillStyle(0x9c6556).fillTriangle(x, y - 5, x - 16, y + 21, x + 16, y + 21);
      g.fillStyle(0xcba78a).fillCircle(x, y - 11, 9);
      g.fillStyle(0x9c9c8e).fillRoundedRect(x - 11, y - 22, 22, 12, 5);
      g.lineStyle(3, 0xbda47c).lineBetween(x + 21, y - 5, x + 21, y + 22);
      g.fillStyle(0xe9b568, 0.15).fillCircle(x + 21, y - 11, 18);
      g.fillStyle(0xf3c67f).fillEllipse(x + 21, y - 10, 8, 12);
      const arrow = guard.facing.y > 0 ? '↓' : guard.facing.y < 0 ? '↑' : guard.facing.x > 0 ? '→' : '←';
      label(x, y + 39, arrow, '#dfaa93', 20);
    });
    const x = state.position.x * 100 + 50, y = state.position.y * 100 + 43;
    g.lineStyle(2, state.status === 'caught' ? 0xf3a18c : 0x9ecfc3, 0.9).strokeCircle(x, y + 4, 28);
    g.fillStyle(0x071418, 0.7).fillEllipse(x, y + 24, 37, 12);
    g.fillStyle(0x83b3a5).fillTriangle(x, y - 8, x - 15, y + 23, x + 15, y + 23);
    g.fillStyle(0xe0c4a0).fillCircle(x, y - 13, 9);
    g.fillStyle(0x496c69).fillTriangle(x - 12, y - 14, x, y - 29, x + 12, y - 14);
    label(x + 30, y - 24, '你', '#d6efe7', 17);
    if (same(state.position, state.checkpoint.position) && state.checkpoint.turn > 0) {
      label(x - 28, y - 24, '⚑', '#d6c7e3', 18);
    }
  }
}
