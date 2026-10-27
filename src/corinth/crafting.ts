export type Piece = { id: string; w: number; h: number; name: string };
export type Placement = { id: string; x: number; y: number; rotated: boolean };
export type Order = {
  id: string;
  title: string;
  cols: number;
  rows: number;
  reward: number;
  pieces: Piece[];
};
export const ORDERS: Order[] = [
  {
    id: "repair",
    title: "第一单 · 修补小篷",
    cols: 4,
    rows: 3,
    reward: 8,
    pieces: [
      { id: "a", w: 2, h: 2, name: "左幅" },
      { id: "b", w: 2, h: 2, name: "右幅" },
      { id: "c", w: 4, h: 1, name: "接边" },
    ],
  },
  {
    id: "cover",
    title: "第二单 · 旅人遮布",
    cols: 5,
    rows: 4,
    reward: 10,
    pieces: [
      { id: "a", w: 3, h: 2, name: "大幅" },
      { id: "b", w: 2, h: 2, name: "小幅" },
      { id: "c", w: 5, h: 1, name: "上边" },
      { id: "d", w: 5, h: 1, name: "下边" },
    ],
  },
  {
    id: "tent",
    title: "第三单 · 合作篷面",
    cols: 6,
    rows: 4,
    reward: 14,
    pieces: [
      { id: "a", w: 2, h: 3, name: "第一幅" },
      { id: "b", w: 2, h: 3, name: "第二幅" },
      { id: "c", w: 2, h: 3, name: "第三幅" },
      { id: "d", w: 6, h: 1, name: "合缝边" },
    ],
  },
];
export function cellsFor(
  order: Order,
  p: Placement,
): { x: number; y: number }[] {
  const piece = order.pieces.find((v) => v.id === p.id);
  if (!piece) return [];
  const w = p.rotated ? piece.h : piece.w,
    h = p.rotated ? piece.w : piece.h;
  return Array.from({ length: w * h }, (_, i) => ({
    x: p.x + (i % w),
    y: p.y + Math.floor(i / w),
  }));
}
export function placePiece(
  order: Order,
  placements: Placement[],
  candidate: Placement,
): Placement[] | null {
  const cells = cellsFor(order, candidate);
  if (
    !cells.length ||
    !Number.isInteger(candidate.x) ||
    !Number.isInteger(candidate.y) ||
    cells.some(
      (c) => c.x < 0 || c.y < 0 || c.x >= order.cols || c.y >= order.rows,
    )
  )
    return null;
  const other = placements.filter((p) => p.id !== candidate.id);
  const occupied = new Set(
    other.flatMap((p) => cellsFor(order, p)).map((c) => `${c.x},${c.y}`),
  );
  if (cells.some((c) => occupied.has(`${c.x},${c.y}`))) return null;
  return [...other, candidate];
}
export function readyToCut(order: Order, placements: Placement[]): boolean {
  if (
    placements.length !== order.pieces.length ||
    new Set(placements.map((p) => p.id)).size !== order.pieces.length
  )
    return false;
  let checked: Placement[] = [];
  for (const p of placements) {
    const next = placePiece(order, checked, p);
    if (!next) return false;
    checked = next;
  }
  return (
    checked.flatMap((p) => cellsFor(order, p)).length ===
    order.cols * order.rows
  );
}
