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
