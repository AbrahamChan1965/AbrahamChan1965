import { useEffect } from "react";
import { same, type Direction } from "../game/engine";
import {
  explorerGuard,
  explorerSight,
  directionTo,
  type ExploreMap,
  type ExploreState,
} from "../game/exploration";
export function Explorer({
  map,
  state,
  onAction,
  onRetry,
  label,
  paused = false,
}: {
  map: ExploreMap;
  state: ExploreState;
  onAction: (action: Direction | "wait" | "interact") => void;
  onRetry?: () => void;
  label: string;
  paused?: boolean;
}) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (
        paused ||
        state.caught ||
        (e.target as HTMLElement).closest("input,textarea,select,dialog,a")
      )
        return;
      const directions: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      if (directions[e.key]) {
        e.preventDefault();
        onAction(directions[e.key]);
      }
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        onAction("interact");
      }
      if (e.key === " " && !(e.target as HTMLElement).closest("button")) {
        e.preventDefault();
        onAction("wait");
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onAction, paused, state.caught]);
  const guard = explorerGuard(map, state.turn),
    forecast = explorerGuard(map, state.turn + 1);
  const sight = explorerSight(map, state.turn),
    nextSight = explorerSight(map, state.turn + 1);
  const here = map.places.find((p) => same(p.position, state.position));
  return (
    <section className="exploration" aria-label={label}>
      <div className="panel-top">
        <span>{label}</span>
        <span>
          回合 {state.turn} · {String.fromCharCode(65 + state.position.x)}
          {state.position.y + 1}
        </span>
      </div>
      <div
        className="explore-map"
        style={{
          gridTemplateColumns: `repeat(${map.rows[0].length},1fr)`,
          minWidth: map.rows[0].length * 44 + (map.rows[0].length - 1) * 5,
        }}
      >
        {map.rows.flatMap((row, y) =>
          [...row].map((tile, x) => {
            const p = { x, y },
              player = same(p, state.position),
              place = map.places.find((v) => same(v.position, p));
            const isGuard = guard && same(guard, p),
              isNext = forecast && same(forecast, p),
              exit = map.exit && same(map.exit, p);
            const danger = sight.some((v) => same(v, p)) && tile !== "S",
              future = nextSight.some((v) => same(v, p)) && tile !== "S";
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                aria-label={`${String.fromCharCode(65 + x)}${y + 1} ${player ? "你在这里，" : ""}${place?.name ?? (exit ? "离城出口" : tile === "#" ? "墙" : tile === "S" ? "遮蔽院落" : "通路")}${isGuard ? "，巡查" : ""}`}
                className={`explore-tile ${tile === "#" ? "wall" : ""} ${tile === "S" ? "shelter" : ""} ${place ? "place" : ""} ${danger ? "danger" : ""} ${future ? "future" : ""} ${player ? "you" : ""} ${exit ? "exit" : ""}`}
                disabled={tile === "#" || state.caught || paused}
                onClick={() => {
                  if (player) onAction("interact");
                  else {
                    const direction = directionTo(state.position, p);
                    if (direction) onAction(direction);
                  }
                }}
              >
                <span aria-hidden="true">
                  {player
                    ? "◈"
                    : isGuard
                      ? "♜"
                      : place
                        ? state.found.includes(place.id)
                          ? "✓"
                          : "◇"
                        : exit
                          ? "↗"
                          : tile === "#"
                            ? ""
                            : isNext
                              ? "○"
                              : "·"}
                </span>
                <small>{place?.name ?? (exit ? "出口" : "")}</small>
              </button>
            );
          }),
        )}
      </div>
      <div className="explore-controls">
        <div className="dpad">
          {(["up", "left", "down", "right"] as Direction[]).map((d) => (
            <button
              key={d}
              className={`direction ${d}`}
              aria-label={`地图向${{ up: "上", down: "下", left: "左", right: "右" }[d]}`}
              disabled={state.caught || paused}
              onClick={() => onAction(d)}
            >
              {{ up: "↑", down: "↓", left: "←", right: "→" }[d]}
            </button>
          ))}
        </div>
        <div className="explore-actions">
          <button
            className="primary"
            disabled={
              !here || state.found.includes(here.id) || state.caught || paused
            }
            onClick={() => onAction("interact")}
          >
            {here ? `调查／联络：${here.name}` : "走到标记地点后互动"}{" "}
            <kbd>E</kbd>
          </button>
          {map.patrol && (
            <button
              disabled={state.caught || paused}
              onClick={() => onAction("wait")}
            >
              等待一回合
            </button>
          )}
        </div>
      </div>
      {map.patrol && (
        <p className="board-note">
          红棕色为当前直线视线，金色边角为下一回合；○为巡查下一步。S院落遮蔽视线，不能与巡查同格。每次有效行动后巡查前进一步。
        </p>
      )}
      {state.caught && (
        <div className="setback" role="alert">
          <strong>护送任务受阻，经文人物结局不变。</strong>
          <button className="primary" onClick={onRetry}>
            回到最近集合点
          </button>
        </div>
      )}
      <p className="fiction-note">
        人物站位、街巷布局与操作任务均为创作重建，非考古平面图。
      </p>
    </section>
  );
}
