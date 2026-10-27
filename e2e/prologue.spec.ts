import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { freshGame, planRoute, step, EXIT } from "../src/game/engine";
import {
  campaignPlaythrough,
  type StepRecord,
} from "../src/tests/campaignPlaythrough";
import {
  CHAPTERS,
  BEREA_CARDS,
  BEREA_SLOTS,
  ATHENS_CARDS,
  ATHENS_SLOTS,
  MEMORIES,
  MEMORY_SLOTS,
  LETTER_INTRO,
} from "../src/campaign/content";
import { ORDERS } from "../src/corinth/crafting";
import { CARE_TASKS } from "../src/campaign/state";

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

const arrows = {
  up: "向上移动",
  down: "向下移动",
  left: "向左移动",
  right: "向右移动",
};
async function escapeInBrowser(page: Page, mobile: boolean) {
  await page.goto("/");
  await page.getByRole("button", { name: /进入街巷/ }).click();
  await page.locator(".phaser-mount canvas").waitFor();
  const actions = planRoute(freshGame(), EXIT)!;
  for (const action of actions) {
    if (action.type === "move") {
      const button = page.getByRole("button", {
        name: arrows[action.direction],
        exact: true,
      });
      if (mobile) await button.tap();
      else await button.click();
    } else await page.getByRole("button", { name: /等待一回合/ }).click();
  }
  await expect(
    page.getByRole("button", { name: "前往庇哩亚 →", exact: true }),
  ).toBeVisible();
  return actions.reduce(step, freshGame());
}
async function perform(page: Page, record: StepRecord, mobile: boolean) {
  const { action, before } = record;
  if (action.type === "continue") {
    await page
      .getByRole("button", {
        name:
          before.chapter === "CH01_MIDNIGHT_ESCAPE"
            ? "前往庇哩亚 →"
            : `继续：${CHAPTERS[CHAPTERS.findIndex((c) => c.id === before.chapter) + 1].title} →`,
        exact: true,
      })
      .click();
  } else if (action.type === "road") {
    const labels = {
      move: "沿路前进 →",
      rest: "共同歇脚 · 用食水换恢复",
      support: "分担同伴行李",
      refill: "绕访补给点",
      investigate: "查问本段路况",
      retry: "回到最近地标",
    };
    if (action.action.type in labels)
      await page
        .getByRole("button", {
          name: labels[action.action.type as keyof typeof labels],
          exact: true,
        })
        .click();
  } else if (
    action.type === "berea-match" ||
    action.type === "athens-match" ||
    action.type === "memory-match"
  ) {
    const cards =
      action.type === "berea-match"
        ? BEREA_CARDS
        : action.type === "athens-match"
          ? ATHENS_CARDS
          : MEMORIES;
    const slots =
      action.type === "berea-match"
        ? BEREA_SLOTS
        : action.type === "athens-match"
          ? ATHENS_SLOTS
          : MEMORY_SLOTS;
    const from = page.getByRole("button", {
      name: `选择线索：${cards.find((c) => c.id === action.card)!.title}`,
      exact: true,
    });
    const to = page.getByRole("button", {
      name: `关联：${slots.find((s) => s.id === action.slot)!.title}`,
      exact: true,
    });
    if (!mobile && action.type === "berea-match" && action.slot === "suffering")
      await from.dragTo(to);
    else {
      if (mobile) {
        await from.tap();
        await to.tap();
      } else {
        await from.click();
        await to.click();
      }
    }
  } else if (action.type === "explore") {
    const label =
      action.action === "interact"
        ? /^调查／联络：/
        : action.action === "wait"
          ? "等待一回合"
          : `地图向${{ up: "上", down: "下", left: "左", right: "右" }[action.action]}`;
    const button = page.getByRole("button", { name: label });
    if (mobile) await button.tap();
    else await button.click();
  } else if (action.type === "coast") {
    const a = action.action;
    if (a.type === "approach")
      await page
        .getByRole("button", { name: "护送向海边前进", exact: true })
        .click();
    if (a.type === "info")
      await page
        .getByRole("button", {
          name: a.id === "transport" ? "查问转运方式" : "查问路况与天气",
          exact: true,
        })
        .click();
    if (a.type === "send")
      await page
        .getByRole("button", { name: "托付集合消息", exact: true })
        .click();
    if (a.type === "route")
      await page
        .getByRole("button", {
          name: new RegExp(a.route === "sea" ? "海路重建" : "陆路重建"),
        })
        .click();
    if (a.type === "sail")
      await page
        .getByRole("button", {
          name: ["向左", "居中", "向右"][a.value],
          exact: true,
        })
        .click();
    if (a.type === "advance")
      await page
        .getByRole("button", {
          name:
            before.coast.route === "sea"
              ? "航行一个区段 →"
              : "沿陆路重建方案前进",
          exact: true,
        })
        .click();
    if (a.type === "rest")
      await page
        .getByRole("button", { name: "停靠休整 · 补水", exact: true })
        .click();
  } else if (action.type === "understand") {
    const labels: Record<string, string> = {
      peace: "他关心安宁与恐惧，也对复活提出问题。",
      order: "他在问秩序、人的处境与生活方式。",
      meaning: "他尚有疑问，也留下继续交谈的意愿。",
    };
    await page
      .getByRole("button", { name: labels[action.interpretation], exact: true })
      .click();
  } else if (action.type === "response") {
    await page
      .getByRole("button", {
        name: new RegExp(
          (
            {
              mock: "有人讥诮",
              again: "有人愿再听",
              believe: "也有人相信",
            } as Record<string, string>
          )[action.id],
        ),
      })
      .click();
  } else if (action.type === "place") {
    const order = ORDERS[before.workshop.order],
      piece = order.pieces.find((p) => p.id === action.placement.id)!;
    const from = page.getByRole("button", {
      name: `选择裁片：${piece.name}`,
      exact: true,
    });
    const to = page.getByRole("button", {
      name: new RegExp(
        `^原料 ${action.placement.x + 1}列${action.placement.y + 1}行`,
      ),
    });
    if (!mobile && before.workshop.order === 0 && piece.id === "a")
      await from.dragTo(to);
    else {
      if (mobile) {
        await from.tap();
        await to.tap();
      } else {
        await from.click();
        await to.click();
      }
    }
  } else if (action.type === "work") {
    const names: Record<string, string> = {
      cut: "量好并裁切 · 2时段",
      stitch: "共用工具拼接 · 2时段",
      deliver: "交付订单 · 1时段",
      buy: "采购12材料 · 3钱币／1时段",
      borrow: "缺料求助：整理借用材料 · 2时段",
      rest: "收工与休息 → 下一日",
      meal: "共同用餐 · 1时段",
      gather: "回顾安息日会堂 · 1时段",
      report: "放下工具，听他们带来的消息",
    };
    await page
      .getByRole("button", {
        name:
          action.action === "care"
            ? action.encounter === "Justus"
              ? "认识提多犹士都 · 1时段"
              : "认识基利司布 · 1时段"
            : names[action.action],
        exact: true,
      })
      .click();
  } else if (action.type === "open-letter")
    await page
      .getByRole("button", { name: "打开第一封信 →", exact: true })
      .click();
  else if (action.type === "receive-letter")
    await page
      .getByRole("button", { name: "接过书信，进入聚会", exact: true })
      .click();
  else if (action.type === "read-letter")
    await page
      .getByRole("button", {
        name: LETTER_INTRO[action.page].title,
        exact: true,
      })
      .click();
  else if (action.type === "assign-care")
    await page
      .getByRole("combobox", {
        name: CARE_TASKS.find((t) => t.id === action.task)!.title,
        exact: true,
      })
      .selectOption(action.person);
  else if (action.type === "care-day")
    await page
      .getByRole("button", { name: "让今天的安排开始", exact: true })
      .click();
}

test("continuous prologue: actual escape to the first letter, with every chapter resumed", async ({
  page,
  isMobile,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  const assetRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    if (
      process.env.PLAYWRIGHT_TEST_STANDALONE === "1" &&
      request.resourceType() !== "document" &&
      !request.url().startsWith("data:")
    )
      assetRequests.push(request.url());
  });
  const escaped = await escapeInBrowser(page, isMobile);
  const records = campaignPlaythrough(escaped, !isMobile);
  for (const record of records) {
    await perform(page, record, isMobile);
    if (record.before.chapter !== record.after.chapter) {
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("road-letters-prologue-v3")!)
                .chapter,
          ),
        )
        .toBe(record.after.chapter);
      await page.reload();
      await expect(page.locator("h1")).toHaveText(
        CHAPTERS.find((c) => c.id === record.after.chapter)!.title,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        record.after.chapter,
      ).toBe(true);
      const smallTargets = await page
        .locator("#campaign-main button")
        .evaluateAll((buttons) =>
          buttons
            .map((button) => ({
              name: button.getAttribute("aria-label") ?? button.textContent,
              box: button.getBoundingClientRect(),
            }))
            .filter(
              (item) =>
                item.box.width > 0 &&
                item.box.height > 0 &&
                (item.box.width < 43.5 || item.box.height < 43.5),
            )
            .map((item) => item.name),
        );
      expect(smallTargets, `touch targets in ${record.after.chapter}`).toEqual(
        [],
      );
    }
    if (record.action.type === "work" && record.action.action === "report") {
      await expect(
        page.getByRole("region", { name: "你走过的旅程" }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByRole("region", { name: "旅程与书信记忆板" }),
      ).toBeVisible();
    }
    if (
      record.action.type === "place" &&
      record.before.workshop.order === 2 &&
      record.action.placement.id === "d"
    )
      await page.screenshot({
        path: testInfo.outputPath("corinth-workshop.png"),
        fullPage: true,
      });
  }
  await expect(
    page.getByText("今天的照顾已接续", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("悲伤中的人今晚有人陪伴。", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("今天的照顾已接续", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "经文与记忆", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("庇哩亚查考经文");
  await expect(page.getByRole("dialog")).toContainText("实际海陆组合");
  await page.getByRole("button", { name: "回到旅程", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("living-letter.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(assetRequests).toEqual([]);
  await page.getByRole("button", { name: "重游前传", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("所有关卡");
  await page.getByRole("button", { name: "确认重游", exact: true }).click();
  await expect(page.getByTestId("turn")).toContainText("00");
  const replayed = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("road-letters-prologue-v3")!),
  );
  expect(replayed.completed).toEqual([]);
  expect(replayed.road.km).toBe(0);
});

test("legacy save continues without replaying the escape, modern transfer and chapter replay persist", async ({
  page,
}) => {
  await page.goto("/");
  const escaped = planRoute(freshGame(), EXIT)!.reduce(step, freshGame());
  await page.evaluate((s) => {
    localStorage.clear();
    localStorage.setItem("road-letters-thessalonica-v1", JSON.stringify(s));
    localStorage.setItem("road-reflection", "不删除这段反思");
  }, escaped);
  await page.reload();
  await page.getByRole("button", { name: "前往庇哩亚 →", exact: true }).click();
  await page.getByRole("button", { name: "分担同伴行李", exact: true }).click();
  await page.getByRole("button", { name: "开启前传音效", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "关闭前传音效", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "关闭前传音效", exact: true }).click();
  await page.getByRole("button", { name: "带回今天", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("早上 · 需要接班").selectOption("helper");
  await dialog.getByLabel("下午 · 我有时间").selectOption("self");
  await dialog.getByLabel("晚上 · 身体需休息").selectOption("rest");
  await dialog
    .getByRole("button", { name: "检查安排与资料", exact: true })
    .click();
  await expect(dialog.getByText(/已形成可行回应/)).toBeVisible();
  await dialog.getByRole("button", { name: "回到游戏", exact: true }).click();
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("road-letters-prologue-v3")!),
  );
  expect(saved.road.supports).toBe(1);
  expect(saved.modern.CH02_78KM_ROAD.complete).toBe(true);
  await page.getByRole("button", { name: "重游本章", exact: true }).click();
  await page.getByRole("button", { name: "确认重游", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("road-letters-prologue-v3")!).road
          .supports,
    ),
  ).toBe(0);
  expect(
    await page.evaluate(() => localStorage.getItem("road-reflection")),
  ).toBe("不删除这段反思");
});
