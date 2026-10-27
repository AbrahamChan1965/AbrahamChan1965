import { test, expect, type Page } from '@playwright/test';
import { freshGame, planRoute, step, HOUSEHOLDS, SHELTER, EXIT, type GameState, type Action } from '../src/game/engine';

async function perform(page: Page, actions: Action[], touch = false) {
  for (const action of actions) {
    if (action.type === 'move') {
      const names = { up: '向上移动', down: '向下移动', left: '向左移动', right: '向右移动' };
      if (touch) await page.getByRole('button', { name: names[action.direction], exact: true }).tap();
      else await page.keyboard.press({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[action.direction]);
    } else if (action.type === 'wait') {
      await page.getByRole('button', { name: /等待一回合/ }).click();
    } else {
      await page.locator('button.interact').click();
    }
  }
}
async function start(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /进入街巷/ }).click();
  await expect(page.locator('.phaser-mount canvas')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Keyboard focus should be on the game/body, rather than a toolbar button.
  await page.locator('h1').click();
}
function route(state: GameState, target: { x: number; y: number }, interact = false) {
  const actions = planRoute(state, target, interact);
  if (!actions) throw new Error('No route found');
  return { actions, state: actions.reduce(step, state) };
}
test('play a complete night: households, checkpoint, reload, departure, and continued care', async ({ page, isMobile }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await start(page);
  let expected = freshGame();
  for (const [target, interact] of [[HOUSEHOLDS[0].position, true], [SHELTER, true], [HOUSEHOLDS[1].position, true]] as const) {
    const leg = route(expected, target, interact);
    await perform(page, leg.actions, isMobile);
    expected = leg.state;
    await expect(page.getByTestId('turn')).toContainText(String(expected.turn).padStart(2, '0'));
  }
  await expect(page.locator('.objective.done')).toHaveCount(2);
  await page.reload();
  await expect(page.getByTestId('turn')).toContainText(String(expected.turn).padStart(2, '0'));
  await expect(page.locator('.objective.done')).toHaveCount(2);
  await page.locator('h1').click();
  const last = route(expected, EXIT);
  await perform(page, last.actions, isMobile);
  await expect(page.getByRole('heading', { name: '你已离开，他们开始彼此寻找。' })).toBeVisible();
  await expect(page.getByText('烘饼人不等宣教者回来，已带着食物去探望邻舍。', { exact: false })).toBeVisible();
  await page.getByLabel('回到今天').fill('把探访交托给一位可以继续陪伴的邻舍。');
  await page.reload();
  await expect(page.getByLabel('回到今天')).toHaveValue('把探访交托给一位可以继续陪伴的邻舍。');
  await page.screenshot({ path: testInfo.outputPath('ending.png'), fullPage: true });
  expect(errors).toEqual([]);
});
test('tile controls, forecast, journal, sound opt-in and capture recovery work', async ({ page, isMobile }, testInfo) => {
  await start(page);
  const action = isMobile ? 'tap' : 'click';
  await page.getByRole('button', { name: /^B6 街道/ })[action]();
  await expect(page.getByTestId('turn')).toContainText('01');
  await page.getByLabel('显示巡查下一步与视线').uncheck();
  await expect(page.getByLabel('显示巡查下一步与视线')).not.toBeChecked();
  await page.getByRole('button', { name: /经文手记/ }).click();
  await expect(page.getByRole('dialog')).toContainText('使徒行传 17:10');
  await expect(page.getByRole('dialog')).toContainText('创作虚构');
  await page.getByRole('button', { name: '回到夜路' }).click();
  await expect(page.getByRole('button', { name: '开启音效' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: '开启音效' }).click();
  await expect(page.getByRole('button', { name: '关闭音效' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '关闭音效' }).click();
  await page.getByRole('button', { name: '减少动态', exact: true }).click();
  await expect(page.locator('.app')).toHaveClass(/reduced-motion/);
  await page.screenshot({ path: testInfo.outputPath('night-map.png'), fullPage: true });
  // Use the planner to reach a real checkpoint, then deliberately take an unsafe route.
  let model = step(freshGame(), { type: 'move', direction: 'right' });
  const leg = route(model, SHELTER, true);
  await page.locator('h1').click();
  await perform(page, leg.actions, isMobile);
  model = leg.state;
  const checkpointTurn = model.turn;
  // Reach a tile beside the western patrol, then wait until spotted.
  const risky = route(model, { x: 4, y: 2 });
  await perform(page, risky.actions, isMobile);
  model = risky.state;
  for (let i = 0; i < 12 && model.status === 'playing'; i++) {
    await page.getByRole('button', { name: /等待一回合/ }).click();
    model = step(model, { type: 'wait' });
  }
  expect(model.status).toBe('caught');
  await expect(page.getByRole('alert')).toContainText('被巡查发现');
  await page.getByRole('button', { name: '从接应点重试 ↻', exact: true }).click();
  await expect(page.getByTestId('turn')).toContainText(String(checkpointTurn).padStart(2, '0'));
  await expect(page.getByRole('button', { name: /D4 接应院落，你在这里/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('corrupt saves recover; restart needs confirmation and preserves reflection', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.setItem('road-letters-thessalonica-v1', '{broken'); localStorage.setItem('road-reflection', '保留反思'); });
  await page.reload();
  await page.getByRole('button', { name: /进入街巷/ }).click();
  await page.getByRole('button', { name: '向右移动', exact: true }).click();
  await page.getByRole('button', { name: '重新开始', exact: true }).click();
  await page.getByRole('button', { name: '继续当前进度' }).click();
  await expect(page.getByTestId('turn')).toContainText('01');
  await page.getByRole('button', { name: '重新开始', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '重新开始', exact: true }).click();
  await expect(page.getByTestId('turn')).toContainText('00');
  expect(await page.evaluate(() => localStorage.getItem('road-reflection'))).toBe('保留反思');
});
