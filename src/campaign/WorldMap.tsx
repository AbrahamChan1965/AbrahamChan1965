import { CHAPTERS, type ChapterId } from "./content";
const POINTS = [
  { title: "帖撒罗尼迦", x: 72, y: 15, ref: "CH01_MIDNIGHT_ESCAPE" },
  { title: "庇哩亚", x: 32, y: 29, ref: "CH03_BEREA_CRISIS" },
  { title: "雅典", x: 70, y: 75, ref: "CH05_ATHENS" },
  { title: "古哥林多", x: 35, y: 86, ref: "CH06_CORINTH_WORKSHOP" },
];
export function WorldMap({
  current,
  compact = false,
}: {
  current: ChapterId;
  compact?: boolean;
}) {
  const index = CHAPTERS.findIndex((c) => c.id === current);
  return (
    <div
      className={`world-map ${compact ? "compact" : ""}`}
      role="img"
      aria-label="大致方位：马其顿的帖撒罗尼迦向西南到庇哩亚，再向南进入亚该亚的雅典，最后向西到哥林多。连线显示顺序，不表示确定航线。"
    >
      <span className="map-region macedonia">马其顿</span>
      <span className="map-region achaia">亚该亚</span>
      <span className="map-sea">爱 琴 海</span>
      <span className="map-north">↑ 北</span>
      {POINTS.slice(0, -1).map((point, i) => {
        const end = POINTS[i + 1],
          dx = end.x - point.x,
          dy = (end.y - point.y) / 1.7;
        return (
          <i
            key={point.title}
            className={`world-line ${i === 1 ? "uncertain" : ""}`}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${Math.hypot(dx, dy)}%`,
              transform: `rotate(${Math.atan2(dy, dx)}rad)`,
            }}
          />
        );
      })}
      {POINTS.map((p, i) => (
        <div
          key={p.title}
          className={`world-point ${index >= CHAPTERS.findIndex((c) => c.id === p.ref) ? "visited" : ""}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <i /> <strong>{p.title}</strong>
          <small>
            {
              [
                "徒17:10 · 夜离",
                "查验与再度分别",
                "观察、等候、对话",
                "工作、同住、书信",
              ][i]
            }
          </small>
        </div>
      ))}
      <span className="route-uncertainty">往雅典的具体海陆路线未详</span>
      <span className="map-scale-note">城市大致方位 · 连线仅表示叙事顺序</span>
    </div>
  );
}
