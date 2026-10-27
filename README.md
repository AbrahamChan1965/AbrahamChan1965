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

## 《道路与书信：帖撒罗尼迦》· V3.1

**[直接打开游戏](https://abrahamchan1965.github.io/AbrahamChan1965/)**，无需安装、账号或外部AI服务。现已将原夜逃接续为「从午夜逃亡到第一封信」：道路、庇哩亚、海岸、雅典、哥林多工坊、互动终章，以及第二篇收信与第一章照顾任务。

已有夜逃存档继续有效。完成第一关后，在原结尾点击「前往庇哩亚」。每一步自动保存在当前浏览器，支持中途刷新；「旅程地图」可重游已到达章节，个人反思仍只存本机。

### 操作

夜逃与探索地图：方向键／WASD或屏幕箭头移动，E调查，空格等待；可点相邻格。经文板与工坊支持拖放，也可先选卡片／裁片，再点目标位置。没有强制实时倒数或快速反应要求。

经文与历史说明随时开放；旅行模型、虚构事件、确切路线不确定性均有标签。不会以信心、恩典、圣洁或圣灵能力评分。三份工坊订单不等于十八个月，完整第二篇仍在发展：第一章已有可玩收信与照顾起点，第二至五章目前为内容导览。

### 开发与验证

Node.js以 `.node-version` 的24.19.0验证。使用现有checkout，无需另建worktree。

```bash
npm ci --cache /tmp/road-npm-cache
npm run dev -- --port 5173 --strictPort
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
PLAYWRIGHT_TEST_PRODUCTION=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

没有本机Chromium时先运行 `npx playwright install chromium`，再省略可执行文件变量运行测试。测试覆盖桌面与手机模拟，非iOS／Android实机认证。

```bash
npm run build:standalone
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:standalone
PLAYWRIGHT_TEST_STANDALONE=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- e2e/prologue.spec.ts --grep 'continuous prologue'
npm run prepare:pages
```

`release/road-and-letters.html`为自包含HTML；`docs/index.html`为GitHub Pages静态入口（main分支的/docs）。受管理Chromium禁止file地址，离线验证由测试路由提供同一HTML，不绕过浏览器政策。工作区文件路径不是已上传附件，不将其冒充下载链接。

### 导演与研究文档

- [前传设计](PROLOGUE_GAME_DESIGN.md)
- [完整分镜与逐场学习设计表](FULL_PROLOGUE_STORYBOARD.md)
- [实际玩法规则](MECHANICS_AND_RULES.md)
- [历史地理与模型边界](HISTORICAL_GEOGRAPHY.md)
- [经文对照](SCRIPTURE_REFERENCE_MATRIX.md)
- [状态与旧存档迁移](CAMPAIGN_STATE_SPEC.md)
- [测试报告](TEST_REPORT.md)
- [发布方式](PUBLISHING.md)

旧版设计文档保留为历史记录；先前的JOURNEY_TO_CORINTH_DESIGN.md是本次执行指引之前的提案，实际完成范围以本版设计和测试报告为准。GIS参考文章在本环境遭403代理限制；78／40／85公里按导演给出的模型使用，不声称本轮独立复核。时长、教学效果及历史工艺仍需真人与专家评测。
