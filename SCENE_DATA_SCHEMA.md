# 场景与状态结构

## 模块边界

| 模块 | 职责 |
| --- | --- |
| `src/game/engine.ts` | 地图、巡查、移动、发现、恢复、路径提示，纯函数，可独立测试 |
| `src/game/NightScene.ts` | Phaser向量画面，只接收状态，不判定通关 |
| `src/game/save.ts` | 带版本与结构检查的本机存档 |
| `src/game/audio.ts` | 用户主动开启的短合成音效，无自动播放 |
| `src/narrative/content.ts` | 标题、开场、家庭联络分支结果与证据标签 |
| `src/scripture/references.ts` | 经文索引、概述与证据等级 |
| `src/ui/MapBoard.tsx` | 动态载入Phaser，React可访问地格及导入失败时的文字回退 |
| `src/App.tsx` | 键盘、触控、任务、对话框、手记与结尾整合 |

## 持久化状态

```ts
type GameState = {
  version: 1;
  position: { x: number; y: number };
  turn: number; // 普通战术时间，不是属灵数值
  contacts: ('weaver' | 'baker')[];
  status: 'playing' | 'caught' | 'escaped';
  checkpoint: {
    position: { x: number; y: number };
    turn: number;
    contacts: ('weaver' | 'baker')[];
  };
  events: string[]; // 最近30条
};
```

存档键为`road-letters-thessalonica-v1`。反思单独存为`road-reflection`，重开路线不删除反思。巡查位置从turn推导，无单独存储，避免读档时错位。画面不持有可独立变更的游戏规则状态。

## 行动与转换

```ts
type Action =
  | { type: 'move'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'wait' | 'interact' };
step(state, action): GameState;
recover(state): GameState;
```

`step`不修改输入对象。无效动作返回回合不变但含反馈的状态。终局拒绝动作。`recover`恢复接应快照。`planRoute`用实际`step`搜索状态，仅输出动作序列，不直接设置成功标志。

## 内容扩展约束

证据等级为`SCRIPTURE_EXPLICIT | HISTORICAL_RECONSTRUCTION | FICTIONAL_SCENARIO | SCHOLARLY_DISPUTED`。未来多语言需要把React内的控制文字也提取到词典；目前仅叙事和经文数据已独立，不宣称完整国际化。

本版没有跨关卡通用叙事引擎、供应品系统、角色属性或十四关场景注册表；这些属于后续工作，避免把未使用的架构冒充功能。
