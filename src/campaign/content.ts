export const CHAPTERS = [
  {
    id: "CH01_MIDNIGHT_ESCAPE",
    title: "午夜逃离帖撒罗尼迦",
    location: "帖撒罗尼迦",
    subtitle: "城门在身后，牵挂仍在城中。",
    ref: "徒 17:5–10",
    icon: "☾",
  },
  {
    id: "CH02_78KM_ROAD",
    title: "七十八公里的路",
    location: "马其顿",
    subtitle: "带着有限的食水，学习怎样一起走远。",
    ref: "徒 17:10",
    icon: "⌁",
  },
  {
    id: "CH03_BEREA_CRISIS",
    title: "庇哩亚：追踪者再现",
    location: "庇哩亚",
    subtitle: "先停下来查验，再把未完的事交托。",
    ref: "徒 17:10–14",
    icon: "▤",
  },
  {
    id: "CH04_COASTAL_EVACUATION",
    title: "奔向海岸",
    location: "往雅典",
    subtitle: "目的地已知，道路仍有未确定的部分。",
    ref: "徒 17:14–15",
    icon: "≈",
  },
  {
    id: "CH05_ATHENS",
    title: "雅典：众神的城市",
    location: "雅典",
    subtitle: "走进他们的问题，也听见不同的回应。",
    ref: "徒 17:16–34",
    icon: "◇",
  },
  {
    id: "CH06_CORINTH_WORKSHOP",
    title: "哥林多的工坊",
    location: "哥林多",
    subtitle: "一路奔波之后，在一张工作台旁安顿下来。",
    ref: "徒 18:1–17；帖前 2–3",
    icon: "⌂",
  },
  {
    id: "EPILOGUE_FIRST_LETTER",
    title: "第一封信",
    location: "哥林多 · 写字桌",
    subtitle: "他们已经离开帖撒罗尼迦，福音的故事没有停止。",
    ref: "帖前 1:1–3",
    icon: "✉",
  },
] as const;
export type ChapterId = (typeof CHAPTERS)[number]["id"];
export type EvidenceLevel =
  | "BIBLICAL_FACT"
  | "HISTORICAL_ESTIMATE"
  | "CREATIVE_RECONSTRUCTION"
  | "SCHOLARLY_UNCERTAIN";
export const LEVELS: Record<EvidenceLevel, string> = {
  BIBLICAL_FACT: "经文明载",
  HISTORICAL_ESTIMATE: "历史估算",
  CREATIVE_RECONSTRUCTION: "创作重建",
  SCHOLARLY_UNCERTAIN: "尚未确定",
};
export const STUDY = [
  {
    ref: "徒 17:1–10",
    level: "BIBLICAL_FACT",
    text: "保罗在帖撒罗尼迦从经文讲论弥赛亚的受苦与复活。有人跟从，也有搅扰与指控；耶孙与弟兄承受压力。弟兄们趁夜送保罗和西拉往庇哩亚。",
  },
  {
    ref: "帖撒罗尼迦 → 庇哩亚",
    level: "HISTORICAL_ESTIMATE",
    text: "本作依执行指引采用约78公里、约两天的行程模型。路加没有记载这段旅行的里程或天数；资源、地标和时段均为游戏化参数。",
  },
  {
    ref: "徒 17:10–15",
    level: "BIBLICAL_FACT",
    text: "庇哩亚的人热切领受，天天查考经文。后来有人从帖撒罗尼迦来搅扰。弟兄送保罗往海边，西拉和提摩太仍留在庇哩亚。护送者带保罗到雅典，并受托请两位同工快来。",
  },
  {
    ref: "庇哩亚的学习桌",
    level: "CREATIVE_RECONSTRUCTION",
    text: "赛53、诗16与徒17:3组成学习用的关联板。使徒行传没有列出庇哩亚当天查阅的确切书卷。赛53与耶稣的关联参徒8:32–35；诗16与复活的关联参徒2:25–32。",
  },
  {
    ref: "庇哩亚 → 彼拿一带 → 雅典",
    level: "SCHOLARLY_UNCERTAIN",
    text: "彼拿一带约40公里是指引提供的沿岸出发假说，非经文明载港口。海路与陆路是可玩重建方案；实际海陆组合及停靠点不能确定。这里没有经文记载的保罗船难。",
  },
  {
    ref: "徒 17:16–34",
    level: "BIBLICAL_FACT",
    text: "保罗在雅典等候，观察、在会堂和市场交流，并在亚略巴古作见证。他从创造与人的处境讲到悔改、审判和复活；有人讥诮，有人愿再听，也有人相信，包括丢尼修和大马哩。",
  },
  {
    ref: "雅典 → 哥林多",
    level: "HISTORICAL_ESTIMATE",
    text: "本作以约85公里作地理参考，非路加记载的测量值。屏幕上的连线显示地点顺序，不代表已经确定的古代道路。",
  },
  {
    ref: "徒 18:1–4",
    level: "BIBLICAL_FACT",
    text: "保罗到哥林多遇见亚居拉和百基拉。两人因革老丢命令的背景从意大利来。保罗与他们同业，同住同工，并每安息日在会堂讲论。经文未交代两人初信的时间，也未说他们事先与保罗约定会合。",
  },
  {
    ref: "工坊中的三份订单",
    level: "CREATIVE_RECONSTRUCTION",
    text: "帐篷类手工业有经文依据；具体原料、模板、客户、订单、工具分工和价格由游戏重建。裁片示意不等于经文记载的帐篷设计。",
  },
  {
    ref: "徒 18:5–17；帖前 3:6–8",
    level: "BIBLICAL_FACT",
    text: "西拉和提摩太从马其顿来到哥林多；帖前记述提摩太带回信心、爱心与相互思念的消息。徒18还记述提多犹士都、基利司布、主的鼓励、一年六个月的教导及迦流事件。游戏以片段压缩呈现，不把一周或三份订单当作全部停留。",
  },
  {
    ref: "帖前 2:17–3:8 的行程关系",
    level: "SCHOLARLY_UNCERTAIN",
    text: "书信与使徒行传提供不同叙事切面。可对照雅典的牵挂、差遣与消息，不能声称每次重聚、往返和逐日日期都已经确定。",
  },
  {
    ref: "帖前 1:1–3",
    level: "BIBLICAL_FACT",
    text: "信的开头列名保罗、西拉（Silvanus）和提摩太，并回顾信心所作的工夫、爱心所受的劳苦和盼望中的忍耐。这里使用概述，非逐字译文。",
  },
  {
    ref: "哥林多的写字桌",
    level: "HISTORICAL_ESTIMATE",
    text: "将第一封信的写作场景放在哥林多，是常见历史重建。本作不指定确切写信日期、执笔人、送信人的身份或实际路线。",
  },
] satisfies { ref: string; level: EvidenceLevel; text: string }[];

export type ClueCard = {
  id: string;
  title: string;
  ref: string;
  text: string;
  explanation: string;
};
export const BEREA_CARDS: ClueCard[] = [
  {
    id: "resurrection",
    title: "不被撇在死亡中",
    ref: "诗 16:8–11；徒 2:25–32",
    text: "诗篇中的盼望，在使徒关于耶稣复活的见证中被引用。",
    explanation:
      "使徒以诗16解释复活的盼望。这里是学习关联，不声称这就是庇哩亚当日查的篇章。",
  },
  {
    id: "proclamation",
    title: "这位耶稣就是基督",
    ref: "徒 17:2–3",
    text: "路加概述保罗从经文讲论：基督必须受苦，并从死里复活。",
    explanation:
      "这是保罗在帖撒罗尼迦讲论的文本概述，帮助连接受苦、复活与耶稣的宣告。",
  },
  {
    id: "suffering",
    title: "担当人的痛苦",
    ref: "赛 53:4–6；徒 8:32–35",
    text: "受苦仆人的段落，与使徒见证耶稣的解释相联系。",
    explanation: "徒8提供赛53与耶稣关联的例子；这里不把查考变成任意拼接经文。",
  },
];
export const BEREA_SLOTS = [
  { id: "suffering", title: "弥赛亚受苦" },
  { id: "resurrection", title: "复活的见证" },
  { id: "proclamation", title: "保罗对耶稣的宣告" },
];
export const ATHENS_CARDS: ClueCard[] = [
  {
    id: "divine",
    title: "未识之神的祭坛",
    ref: "徒 17:23–24",
    text: "祭坛成为交流的起点；保罗宣讲创造天地的主。",
    explanation: "从当地敬拜的观察进入见证，神并非人手造的形像。",
  },
  {
    id: "life",
    title: "生命与气息",
    ref: "徒 17:24–25",
    text: "神赐人生命、气息和万物，并不缺少人的供给。",
    explanation: "生命的源头不依赖人的供奉来维持自己。",
  },
  {
    id: "near",
    title: "诗人与寻求",
    ref: "徒 17:27–29",
    text: "保罗引述诗人，也指出神离人不远。",
    explanation: "文化语言可以成为交流的桥梁，却不取消对偶像的分辨。",
  },
  {
    id: "repent",
    title: "当下的邀请",
    ref: "徒 17:30",
    text: "信息邀请各处的人悔改。",
    explanation: "论证没有停在对文化的欣赏，还包含具体的转向。",
  },
  {
    id: "judgment",
    title: "公义的盼望",
    ref: "徒 17:31",
    text: "神设立日子，借所立的人按公义审判。",
    explanation: "审判与神的公义相连，不是玩家向异见者报复的奖励。",
  },
  {
    id: "raised",
    title: "从死里复活",
    ref: "徒 17:31–34",
    text: "复活的见证引出不同回应：讥诮、愿再听、相信。",
    explanation: "保留复活与不同回应；不以让所有人认同来衡量胜利。",
  },
];
export const ATHENS_SLOTS = [
  { id: "divine", title: "神是什么样的？" },
  { id: "life", title: "生命从何而来？" },
  { id: "near", title: "神与人有何关系？" },
  { id: "repent", title: "人怎样回应？" },
  { id: "judgment", title: "公义与审判" },
  { id: "raised", title: "复活与听者" },
];
export const MEMORIES: ClueCard[] = [
  {
    id: "thanks",
    title: "为他们感恩",
    ref: "帖前 1:2–3",
    text: "记念信心的行动、爱心的劳苦与盼望的忍耐。",
    explanation: "消息进入感恩，不是宣教者个人的战绩表。",
  },
  {
    id: "birth",
    title: "一群人领受真道",
    ref: "徒 17:1–4；帖前 1:6–8",
    text: "群体在患难中领受，也成为向外见证的人。",
    explanation: "教会有自己的群体生命。",
  },
  {
    id: "care",
    title: "盼望再相见",
    ref: "帖前 2:17–3:13",
    text: "离别没有结束关系；鼓励、祈求和照顾仍要继续。",
    explanation: "写信是牧养关系的延续，而不是结束任务的收据。",
  },
  {
    id: "report",
    title: "提摩太带回消息",
    ref: "徒 18:5；帖前 3:6–8",
    text: "他们仍有信心和爱心，也记念着宣教者。",
    explanation: "书信与使徒行传可相互照亮，逐日协调仍须谨慎。",
  },
  {
    id: "separation",
    title: "被迫的离别",
    ref: "徒 17:5–10；帖前 2:17–18",
    text: "离开的是身体，不是对群体的牵挂。",
    explanation: "被迫离开并不自动等于福音失败。",
  },
];
export const MEMORY_SLOTS = [
  { id: "birth", title: "01 · 群体诞生" },
  { id: "separation", title: "02 · 艰难离别" },
  { id: "report", title: "03 · 传回消息" },
  { id: "thanks", title: "04 · 感恩回望" },
  { id: "care", title: "05 · 继续关怀" },
];
export const LETTER_INTRO = [
  {
    title: "第一章 · 信、爱、望",
    ref: "帖前 1:1–10",
    text: "保罗、西拉和提摩太向群体问安，并记念他们信心的行动、爱心的劳苦与盼望的忍耐。福音从他们那里传扬出去。",
  },
  {
    title: "第二章 · 宣教者的心",
    ref: "帖前 2:1–20",
    text: "劳苦、诚实、温柔与劝勉，构成共同生活的记忆。被迫分离之后，宣教者仍渴望再见这群人。",
  },
  {
    title: "第三章 · 等候与好消息",
    ref: "帖前 3:1–13",
    text: "差遣、等候与提摩太带回的消息，使读者认识关怀如何跨越距离。这份喜乐转为祈求与坚固。",
  },
  {
    title: "第四章 · 生活与盼望",
    ref: "帖前 4:1–18",
    text: "爱、工作与圣洁进入日常，也进入对死亡和复活的盼望。彼此劝慰不要求悲伤立即消失。",
  },
  {
    title: "第五章 · 彼此建立",
    ref: "帖前 5:1–28",
    text: "警醒、彼此建立、扶助软弱、察验与祷告，构成等候中的群体生活。此处是阅读导览，后续主游戏尚未制作。",
  },
];
