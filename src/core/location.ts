import type { Item, Location } from "./types";

export const DEFAULT_LOCATIONS: Location[] = [
  { id: "room", name: "방", parentId: null, depth: 0, order: 0 },
  { id: "kitchen", name: "부엌", parentId: null, depth: 0, order: 1 },
  { id: "bathroom", name: "화장실", parentId: null, depth: 0, order: 2 },
];

/** 자기 자신 + 모든 하위 위치 id */
export function getDescendantIds(locations: Location[], id: string): string[] {
  const ids = [id];
  for (let i = 0; i < ids.length; i++) {
    for (const loc of locations) {
      if (loc.parentId === ids[i]) ids.push(loc.id);
    }
  }
  return ids;
}

/** "방 > 1번 서랍장" */
export function getLocationPath(locations: Location[], id: string): string {
  const names: string[] = [];
  let cur = locations.find((l) => l.id === id);
  while (cur) {
    names.unshift(cur.name);
    const parentId = cur.parentId;
    cur = locations.find((l) => l.id === parentId);
  }
  return names.join(" > ");
}

export const MAX_DEPTH = 2;

const siblingsOf = (locations: Location[], parentId: string | null) =>
  locations
    .filter((l) => l.parentId === parentId)
    .sort((a, b) => a.order - b.order);

/** 트리 순서(부모 → 자식, 같은 부모 안에서는 order)로 펼친 목록. parentId를 주면 그 하위만 */
export function flattenTree(
  locations: Location[],
  parentId: string | null = null,
): Location[] {
  return siblingsOf(locations, parentId).flatMap((l) => [
    l,
    ...flattenTree(locations, l.id),
  ]);
}

/** 가장 위(depth 0) 조상 id */
export function getRootId(locations: Location[], id: string): string {
  let cur = locations.find((l) => l.id === id);
  while (cur?.parentId) {
    const parentId = cur.parentId;
    cur = locations.find((l) => l.id === parentId);
  }
  return cur?.id ?? id;
}

/** 새 위치. 같은 부모의 맨 뒤에 붙는다 */
export function createLocation(
  locations: Location[],
  name: string,
  parentId: string | null,
): Location {
  const parent = locations.find((l) => l.id === parentId);
  const depth = parent ? parent.depth + 1 : 0;
  if (depth > MAX_DEPTH) throw new Error("위치는 3단계까지만 만들 수 있습니다");
  const siblings = siblingsOf(locations, parentId);
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    parentId,
    depth,
    order: siblings.length ? siblings[siblings.length - 1].order + 1 : 0,
  };
}

/** 같은 부모 안에서 한 칸 위(-1)/아래(1)로. 바뀐 두 위치를 돌려주고, 끝이면 빈 배열 */
export function moveLocation(
  locations: Location[],
  id: string,
  dir: -1 | 1,
): Location[] {
  const loc = locations.find((l) => l.id === id);
  if (!loc) return [];
  const siblings = siblingsOf(locations, loc.parentId);
  const other = siblings[siblings.findIndex((l) => l.id === id) + dir];
  if (!other) return [];
  return [
    { ...loc, order: other.order },
    { ...other, order: loc.order },
  ];
}

/** 삭제를 막는 하위 위치·재고 수. 둘 다 0이어야 삭제 가능 */
export function getDeleteBlockers(
  locations: Location[],
  items: Item[],
  id: string,
) {
  return {
    children: locations.filter((l) => l.parentId === id).length,
    items: items.filter((i) => i.locationId === id).length,
  };
}

/** 위치(하위 포함)의 재고를 등록순으로 */
export function getItemsInLocation(
  items: Item[],
  locations: Location[],
  locationId: string,
): Item[] {
  const ids = new Set(getDescendantIds(locations, locationId));
  return items
    .filter((item) => ids.has(item.locationId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
