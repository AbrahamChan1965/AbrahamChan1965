import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
// Node 24 can load this pure TypeScript module directly; no browser test hooks in the app.
import { freshGame, planRoute, step, HOUSEHOLDS, SHELTER, EXIT } from '../src/game/engine.ts';

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {});
try {
  const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 1100 } });
  // The managed Chromium disallows file:// navigation. Serve the exact file from
  // an intercepted loopback document while offline; any asset request is a failure.
  const documentURL = 'http://127.0.0.1:4188/standalone';
  const html = await readFile(new URL('../release/road-and-letters.html', import.meta.url), 'utf8');
  await context.route('**/*', route => route.request().url() === documentURL
    ? route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html })
    : route.abort());
  const page = await context.newPage();
  const errors = [];
  const networkRequests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.url() !== documentURL) networkRequests.push(r.url()); });
  await page.goto(documentURL);
  await page.getByRole('button', { name: /进入街巷/ }).click();
  await page.locator('.phaser-mount canvas').waitFor();
  let state = freshGame();
  for (const [target, interact] of [[HOUSEHOLDS[0].position, true], [SHELTER, true], [HOUSEHOLDS[1].position, true], [EXIT, false]]) {
    const route = planRoute(state, target, interact);
    assert.ok(route, 'A legal safe route exists');
    for (const action of route) {
      if (action.type === 'move') await page.getByRole('button', { name: { up: '向上移动', down: '向下移动', left: '向左移动', right: '向右移动' }[action.direction], exact: true }).click();
      else if (action.type === 'wait') await page.getByRole('button', { name: /等待一回合/ }).click();
      else await page.locator('button.interact').click();
      state = step(state, action);
    }
    if (interact) {
      await page.reload();
      assert.ok((await page.getByTestId('turn').textContent()).includes(String(state.turn).padStart(2, '0')));
    }
  }
  await page.getByRole('heading', { name: '你已离开，他们开始彼此寻找。' }).waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(networkRequests, []);
  await page.screenshot({ path: 'release/ending-desktop.png', fullPage: true });
  console.log('PASS: standalone HTML via an offline intercepted document, both households, checkpoint/reload, departure and narrative outcome; zero asset requests or page errors. Direct file:// navigation is unverified because managed Chromium blocks it.');
} finally {
  await browser.close();
}
