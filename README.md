# 👋 Hello, I'm Abraham 
### Digital Curator | AIGC Workflow Expert | Researcher of Christian Philosophy & Classical Chinese Thought

> **"At its essence, life is a collection of events comprising Memory, Understanding, and Will (Action)."**
> —— Anchored in the psychological framework of St. Augustine’s *De Trinitate*, driving digital practice in the 21st century.

---

## 🧩 The Trinity Event Framework (TEF)
I perceive all digital creation and research as extensions of soul functions, utilizing AI to realize the following triune event flow:

### 1. Memory Events — Knowledge Archiving & Historical Context
* **Essence**: Digitizing Chinese-Western intellectual history and 400 years of "American New World" practical wisdom.
* **Practice**: Building personal knowledge bases integrating Puritan historical studies and ethical literature.
* **Tech**: Knowledge Graphs, Vector Databases, GitHub Archives.

### 2. Intelligence Events — Logical Reasoning & Cross-Dimensional Linking
* **Essence**: Reconstructing fragmented memories through AI-driven comparative studies and logical synthesis.
* **Practice**: Designing deep Prompt Engineering to transform classical wisdom into contemporary insights.
* **Tech**: LLM Logic Chains, Context Engineering, Semantic Analysis.

### 3. Will/Action Events — Creative Practice & Manifestation
* **Essence**: Manifesting understanding into "Action Events" that impact the real world.
* **Practice**: AIGC multimedia production (Suno Music, Filmora Video) and Digital Education Systems.
* **Tech**: Python Automation, AI Audio/Video Production, Web App Architecture.

---

<details>
<summary><b>🇨🇳 點擊展開中文版介紹 (Click to view Chinese Version)</b></summary>

### 👋 你好，我是 Abraham
**數位策展人 | AIGC 工作流專家 | 基督教神哲學與先秦思想研究者**

> **「生命本質而言，是記憶、理解與意志（行動）的事件集合。」**
> —— 我基於奧古斯丁《de Trinitate》的心靈結構思考，驅動二十一世紀的數位實踐。

#### 🧩 核心框架：The Trinity Event Framework (TEF)
* **記憶 (Memory)**：將中西思想史與新世界 400 年的實踐智慧「數位化」。
* **理解 (Intelligence)**：透過 AI 對碎片化記憶進行「中西思想史比效」與邏輯重構。
* **意志 (Will/Action)**：透過 AIGC 多媒體創作與數位教育系統，將理解轉化為實踐成果。

</details>

---

## 📊 Digital Footprint
![Abraham's GitHub Stats](https://github-readme-stats.vercel.app/api?username=AbrahamChan1965&show_icons=true&theme=radical)
![Top Langs](https://github-readme-stats.vercel.app/api/top-langs/?username=AbrahamChan1965&layout=compact&theme=radical)

---

## 📅 Ongoing "Will" Events
- **[Inspiration of Puritans 清教徒的启迪]**: Book launch and multimedia promotion project.
- **[Lectionary Prayer(https://sites.google.com/view/walkwiththelordhomepage/%E8%88%87%E4%B8%BB%E5%90%8C%E8%A1%8C)]**: Promoting the Lectionary Prayer movement.
- **[Theology Masterpieces]**: Digital Twin course development.
- **[Golden Lampstand Global(https://www.youtube.com/channel/UCEoMl6XvMbWMpNn2e26LOlg)]**: Optimization of cross-border teaching and music systems.

---

## 📫 Connect with Me
- **Visual ID**: 🟣 Bishop Purple & 🟡 Gold
- **Core Mission**: Integrating human "Canons" with the passion for 21st-century exploration.
- **Key Project**: Developing **GEMs (Generative Expert Models)** for "Theology Classics" and "Life Coaching."
- **Tech Focus**: AIGC mp3-to-mp4 workflow (Absolute Audio-Visual Alignment) for truth dissemination.

---

## 《道路与书信》可玩原型

已实现第一关 **「午夜逃离帖撒罗尼迦」**：8×7 回合制潜行地图、巡查视线与预告、家庭联络、接应点重试、本地存档，以及离城后的群体叙事。玩家扮演虚构同工；保罗与西拉夜往庇哩亚的经文结局固定。

**直接试玩：** 本次交付附有 `release/road-and-letters.html` 单文件版，下载到电脑后用现代浏览器打开即可，无需安装或联网。生成文件不纳入Git；开发者可用 `npm run build:standalone` 重建。手机浏览器通常不能直接运行下载文件，可使用开发服务器提供的页面。文件地址下的本机存档依浏览器支持而定；正式版建议通过HTTP提供页面。

需要 Node.js 22.12+（本环境以 24.19.0 验证）。在仓库根目录运行：

```bash
npm ci --cache /tmp/road-npm-cache
npm run dev -- --port 5173 --strictPort
```

浏览器打开 Vite 输出的地址即可游戏。云端访问方式取决于工作区提供的端口访问功能；本项目未公开部署。也可运行 `npm run build` 后用 `npm run preview` 检查生产包。无需账号、密钥、后端服务或外部 AI API。

操作：方向键 / WASD 或点击相邻格移动；空格等待；E 联络／保存接应点。手机使用屏幕方向按钮。没有实时倒计时。进度和个人反思只保存在当前浏览器；清理浏览器数据会删除它们。

验证命令：

```bash
npm test
npm run build
# 首次使用 Playwright 时安装其浏览器：
npx playwright install chromium
npm run test:e2e
# 本云端环境已有 Chromium，可直接使用：
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
# 用生产包执行同一浏览器流程（先 build）：
PLAYWRIGHT_TEST_PRODUCTION=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
# Node 24 下检查单文件版的离线完整流程（先 build:standalone）：
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:standalone
```

设计与边界：[游戏设计](GAME_DESIGN_BIBLE.md)、[分镜](FULL_STORYBOARD.md)、[玩法规则](MECHANICS_AND_RULES.md)、[经文对照](SCRIPTURE_REFERENCE_MATRIX.md)、[状态结构](SCENE_DATA_SCHEMA.md)、[历史审阅](HISTORICAL_REVIEW.md)、[测试报告](TEST_REPORT.md)。本版只实现这一个小游戏，其余章节尚未制作。

网页版发布文件位于 `docs/`，通过 `npm run prepare:pages` 重建。GitHub Pages 的来源应选择 `main` 分支的 `/docs` 文件夹，详见 [发布说明](PUBLISHING.md)。
