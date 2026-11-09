import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCATIONS,
  getDescendantIds,
  getItemsInLocation,
  getLocationPath,
} from "./location";
import type { Item, Location } from "./types";

const locations: Location[] = [
  ...DEFAULT_LOCATIONS,
  { id: "drawer1", name: "1번 서랍장", parentId: "room", depth: 1, order: 0 },
  { id: "slot2", name: "2칸", parentId: "drawer1", depth: 2, order: 0 },
];

const item = (id: string, locationId: string, createdAt: string) =>
  ({ id, locationId, createdAt }) as Item;

describe("위치 계산", () => {
  it("getDescendantIds는 자기 자신과 모든 하위 위치를 돌려준다", () => {
    expect(getDescendantIds(locations, "room").sort()).toEqual(
      ["room", "drawer1", "slot2"].sort(),
    );
    expect(getDescendantIds(locations, "kitchen")).toEqual(["kitchen"]);
  });

  it("getLocationPath는 최상위부터 경로를 만든다", () => {
    expect(getLocationPath(locations, "slot2")).toBe("방 > 1번 서랍장 > 2칸");
    expect(getLocationPath(locations, "kitchen")).toBe("부엌");
  });

  it("getItemsInLocation은 하위 위치 재고를 포함해 등록순으로 돌려준다", () => {
    const items = [
      item("c", "slot2", "2026-11-03"),
      item("k", "kitchen", "2026-11-01"),
      item("a", "room", "2026-11-01"),
      item("b", "drawer1", "2026-11-02"),
    ];
    expect(
      getItemsInLocation(items, locations, "room").map((i) => i.id),
    ).toEqual(["a", "b", "c"]);
    expect(
      getItemsInLocation(items, locations, "kitchen").map((i) => i.id),
    ).toEqual(["k"]);
  });
});
