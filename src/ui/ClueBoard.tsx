import { useState } from "react";
import type { ClueCard } from "../campaign/content";
export function ClueBoard({
  cards,
  slots,
  matched,
  onMatch,
  label,
  disabled = false,
}: {
  cards: ClueCard[];
  slots: { id: string; title: string }[];
  matched: Record<string, string>;
  onMatch: (slot: string, card: string) => void;
  label: string;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string>("");
  const submit = (slot: string, card = selected) => {
    if (card && !disabled) onMatch(slot, card);
  };
  return (
    <section className="clue-board" aria-label={label}>
      <p className="interaction-instruction">
        先点选一张线索卡，再点放置位置。电脑也可以拖放；所有卡片的出处均可直接查看。
      </p>
      <div className="clue-tray" role="group" aria-label="线索卡片">
        {cards.map((card) => (
          <article
            key={card.id}
            className={`clue-card ${selected === card.id ? "selected" : ""} ${Object.values(matched).includes(card.id) ? "used" : ""}`}
          >
            <button
              type="button"
              draggable={!disabled}
              aria-pressed={selected === card.id}
              aria-label={`选择线索：${card.title}`}
              disabled={disabled || Object.values(matched).includes(card.id)}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", card.id);
                setSelected(card.id);
              }}
              onClick={() => setSelected(card.id)}
            >
              <span className="card-corner">
                {Object.values(matched).includes(card.id) ? "✓" : "▤"}
              </span>
              <strong>{card.title}</strong>
              <small>{card.ref}</small>
              <span>{card.text}</span>
            </button>
            <details>
              <summary>出处与关联说明</summary>
              <p>{card.explanation}</p>
            </details>
          </article>
        ))}
      </div>
      <div className="clue-slots" role="group" aria-label="关联位置">
        {slots.map((slot) => (
          <button
            type="button"
            key={slot.id}
            className={`clue-slot ${matched[slot.id] ? "matched" : ""}`}
            aria-label={`关联：${slot.title}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              submit(slot.id, e.dataTransfer.getData("text/plain"));
            }}
            onClick={() => submit(slot.id)}
            disabled={disabled || !!matched[slot.id]}
          >
            <span>{matched[slot.id] ? "✓" : "+"}</span>
            <strong>{slot.title}</strong>
            <small>
              {matched[slot.id]
                ? cards.find((c) => c.id === matched[slot.id])?.title
                : selected
                  ? `放置「${cards.find((c) => c.id === selected)?.title}」`
                  : "选择线索后放到这里"}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
