import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test.beforeEach(async ({ context }) => {
  if (process.env.PLAYWRIGHT_TEST_STANDALONE !== "1") return;
  const html = await readFile("release/road-and-letters.html", "utf8");
  await context.setOffline(true);
  await context.route("**/*", (route) =>
    route.request().resourceType() === "document"
      ? route.fulfill({
          status: 200,
          contentType: "text/html; charset=utf-8",
          body: html,
        })
      : route.abort(),
  );
});
test("leave any unfinished scene, choose freely, then resume the exact saved work", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "先选择一个场景玩", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /哥林多的工坊/ })
    .click();
  await expect(page.locator("h1")).toHaveText("哥林多的工坊");
  await expect(
    page.getByRole("region", { name: "本场景目标与自由切换" }),
  ).toContainText("目标尚未完成");
  await page
    .getByRole("button", { name: "选择裁片：左幅", exact: true })
    .click();
  await page.getByRole("button", { name: /^原料 1列1行/ }).click();
  await page.getByRole("button", { name: "下一个场景 →", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("第一封信");
  await expect(
    page.getByText("书信序幕 · 自由体验（前传尚未全部完成）", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "选择场景", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /七十八公里的路/ })
    .click();
  await page.getByRole("button", { name: "沿路前进 →", exact: true }).click();
  await page.getByRole("button", { name: "下一个场景 →", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("庇哩亚：追踪者再现");
  await page.getByRole("button", { name: "下一个场景 →", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("奔向海岸");
  await page.reload();
  await page.getByRole("button", { name: "选择场景", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /哥林多的工坊/ })
    .click();
  await expect(
    page.getByRole("button", { name: "原料 1列1行，裁片a", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "选择场景", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /七十八公里的路/ })
    .click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("road-letters-prologue-v3")!),
  );
  expect(saved.road.km).toBe(6);
  expect(saved.completed).toEqual([]);
});

test("unfinished night escape can be left and resumed without resetting", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /进入街巷/ }).click();
  await page.getByRole("button", { name: "向右移动", exact: true }).click();
  await page.getByRole("button", { name: "下一个场景 →", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("七十八公里的路");
  await page.getByRole("button", { name: "选择场景", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /午夜逃离帖撒罗尼迦/ })
    .click();
  await expect(page.getByTestId("turn")).toContainText("01");
  await expect(
    page.getByRole("button", { name: /B6 街道，你在这里/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("turn")).toContainText("01");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("road-letters-prologue-v3")!),
  );
  expect(saved.completed).toEqual([]);
});
