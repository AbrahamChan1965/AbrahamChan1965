# 前传状态、存档与章节控制

## 兼容策略

旧存档键 `road-letters-thessalonica-v1` 和其version 1结构不变，第一关继续由原引擎与原读写器负责。新存档键为 `road-letters-prologue-v3`，version 3。

没有有效新存档时，从有效旧存档导入 `escape`。旧关未完成则保留位置、巡查与接应点继续玩；旧关已完成则保留完成记录，仍显示原结尾及「前往庇哩亚」，不会逼玩家重跑。新存档有效时优先恢复新章节。缺失或损坏的新存档回退到有效旧存档，无旧存档则安全开新局。个人反思键 `road-reflection` 不删除。

游戏动作不依赖实时计时、网络或外部AI，动态环境均从已保存状态推导。可在每个动作之后刷新继续。写入失败会明确提示，当前页面仍可玩。

## 单一事实来源

| 导演要求的状态 | 实际结构／来源 |
| --- | --- |
| campaignChapter | `chapter`：七个固定场景ID之一 |
| activeScene | 由chapter与berea.phase、coast.stage、athens.phase、workshop.phase或letter.phase派生，不重复存储 |
| playerPosition | 原关`escape.position`，新探索地图各自`explorer.position` |
| journeyDistance / journeyTime | `road.km/hours`、`coast.approach/progress/hours` |
| travelSupplies / fatigue | road与coast的water/food/fatigue，以及road.companionFatigue |
| routeChoices | `road.choices`与`coast.route`及相关flags |
| inventory / discoveredEvidence | 各explorer.found、clues与各匹配板matched；不是未使用的空通用背包 |
| scriptureJournal | `journal`：发现／关联过的章节；所有经文说明仍始终开放 |
| workshopMaterials / completedOrders | workshop.materials、income、completedOrders、placements、stage |
| characterEncounters | workshop.encounters及athens.understood/responses |
| missionFlags | flags、各子状态的门槛与完成状态 |
| completedChapters | `completed`：真实通过的章节ID，用于进度和重游 |
| 旅程记忆 | `memories`跨关保留；哥林多workshop.memories为实际可操作关联板 |
| 现代应用 | `modern[chapter]`：计划、已查资料、回应与普通约束完成状态 |
| 第二篇 | `letterOpen`与letter.phase/heard/page/assignments/dayComplete |

不存在spiritualLevel、holinessPoints、HolySpiritPower、faithScore、divineApproval等数值。

## 完成门槛

`campaignStep`是章节动作的统一入口。V3.2保留原continue作为“完成后继续”的操作，同时新增visit自由切换：任何章节均可随时访问，不要求前一关通关。未完成场景的子状态完整保留，访问和返回不重置，不伪造通关。场景内操作不能改变未激活的其他章节；首次进入的少量初始条件按已存在的行程记录设置，返回时不重新初始化。重游只允许当前或已经完成的章节，重置该章操作状态，保留旅程记忆和其他完成记录。

第一关的原有重试不改写历史；新撤离地图恢复自己的完整接应快照。道路在地标保存距离、资源、时间、同伴扶持与路况状态；受阻恢复该快照。海岸段恢复护送／交通接应，保留查到的消息并重新补给。其他不受实时危险的谜题允许更正，不抹除已学到的文本。

## 完整链路测试

测试用纯函数规划实际合法动作，再在浏览器逐项执行。浏览器端不提供跳关后门，不直接设置终局。独立的兼容测试才注入旧版存档，以验证真实用户的旧存档恢复。全链路测试在每个新章节抵达后刷新，并在报告与最终群体任务之后再次刷新。


全前传重游与单章重游分开：终章的「重游前传」重置所有操作、完成状态与第二篇任务，但保留已经建立的经文记录、旅程记忆与现代练习；单章重游只重置该章。个人反思键始终不被重游清除。
