import { flattenTree } from "./location";
import type { FurnitureKind, Location, Placement } from "./types";

type Size = { w: number; h: number };
type Rect = Pick<Placement, "x" | "y" | "w" | "h">;

/** 집 전체 격자 (1칸 = 50cm, 12m × 8m) */
export const HOUSE: Size = { w: 24, h: 16 };
export const ROOM_SIZE: Size = { w: 6, h: 5 };
export const ROOM_MIN = 2;

export const FURNITURE: Record<FurnitureKind, Size & { name: string }> = {
  fridge: { name: "냉장고", w: 2, h: 2 },
  drawer: { name: "서랍장", w: 2, h: 1 },
  wardrobe: { name: "옷장", w: 3, h: 1 },
  shelf: { name: "선반", w: 2, h: 1 },
  cabinet: { name: "수납장", w: 2, h: 1 },
  etc: { name: "기타", w: 1, h: 1 },
};

/** 겹치면 true. 변만 맞붙는 것은 겹침이 아니다 */
export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** 영역 안에 완전히 들어가는지 */
export const fitsIn = (r: Rect, area: Size) =>
  r.x >= 0 && r.y >= 0 && r.x + r.w <= area.w && r.y + r.h <= area.h;

/** 위→아래, 왼쪽→오른쪽으로 훑어 처음 들어가는 빈 자리. 없으면 null */
export function findFreeSpot(
  taken: Rect[],
  size: Size,
  area: Size,
): Rect | null {
  for (let y = 0; y + size.h <= area.h; y++) {
    for (let x = 0; x + size.w <= area.w; x++) {
      const r = { x, y, w: size.w, h: size.h };
      if (!taken.some((t) => overlaps(r, t))) return r;
    }
  }
  return null;
}

/**
 * 위치 목록과 배치를 맞춘다.
 * - 없어진 위치, 가구 안 칸(depth 2)의 배치는 버린다
 * - 배치 없는 방은 집 안 빈 자리에 기본 크기(안 되면 최소 크기)로,
 *   배치 없는 가구는 자기 방 안 빈 자리에 1×1 "기타"로 놓는다
 * - 자리가 없으면 놓지 않는다 (ponytail: 집이 꽉 찬 경우. 꾸미기에서 자리를 비우면 다음에 놓인다)
 * 바뀐 것이 없으면 받은 배열을 그대로 돌려준다
 */
export function autoPlace(
  locations: Location[],
  layout: Placement[],
): Placement[] {
  const byId = new Map(locations.map((l) => [l.id, l]));
  const kept = layout.filter((p) => (byId.get(p.locationId)?.depth ?? 2) < 2);
  const placed = new Set(kept.map((p) => p.locationId));
  const result = [...kept];

  for (const loc of flattenTree(locations)) {
    if (loc.depth > 1 || placed.has(loc.id)) continue;
    const area =
      loc.depth === 0
        ? HOUSE
        : result.find((p) => p.locationId === loc.parentId);
    if (!area) continue; // 부모 방이 놓이지 못함
    const siblings = result.filter(
      (p) => byId.get(p.locationId)?.parentId === loc.parentId,
    );
    const sizes =
      loc.depth === 0
        ? [ROOM_SIZE, { w: ROOM_MIN, h: ROOM_MIN }]
        : [FURNITURE.etc];
    let spot: Rect | null = null;
    for (const s of sizes) if ((spot = findFreeSpot(siblings, s, area))) break;
    if (!spot) continue;
    result.push(
      loc.depth === 0
        ? { locationId: loc.id, ...spot }
        : { locationId: loc.id, ...spot, kind: "etc" },
    );
  }

  return result.length === layout.length && kept.length === layout.length
    ? layout
    : result;
}
