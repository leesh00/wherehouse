import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCATIONS,
  createLocation,
  flattenTree,
  getDeleteBlockers,
  getRootId,
  moveLocation,
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

describe("위치 편집", () => {
  const tree = [
    ...locations,
    { id: "desk", name: "책상", parentId: "room", depth: 1, order: 1 },
  ];
  const ids = (list: Location[]) => list.map((l) => l.id);

  it("flattenTree는 부모 → 자식, order 순으로 펼친다", () => {
    expect(ids(flattenTree(tree))).toEqual([
      "room",
      "drawer1",
      "slot2",
      "desk",
      "kitchen",
      "bathroom",
    ]);
    expect(ids(flattenTree(tree, "room"))).toEqual([
      "drawer1",
      "slot2",
      "desk",
    ]);
  });

  it("getRootId는 최상위 조상을 찾는다", () => {
    expect(getRootId(tree, "slot2")).toBe("room");
    expect(getRootId(tree, "kitchen")).toBe("kitchen");
  });

  it("createLocation은 부모 depth+1, 같은 부모의 맨 뒤 order로 만든다", () => {
    const top = createLocation(tree, " 베란다 ", null);
    expect(top).toMatchObject({
      name: "베란다",
      parentId: null,
      depth: 0,
      order: 3,
    });
    expect(createLocation(tree, "선반", "kitchen")).toMatchObject({
      depth: 1,
      order: 0,
    });
    expect(createLocation(tree, "칸", "drawer1")).toMatchObject({
      depth: 2,
      order: 1,
    });
  });

  it("depth 2 아래에는 만들 수 없다", () => {
    expect(() => createLocation(tree, "더 아래", "slot2")).toThrow();
  });

  it("moveLocation은 같은 부모 안의 이웃과 order를 바꾼다", () => {
    expect(moveLocation(tree, "kitchen", -1)).toEqual([
      { ...DEFAULT_LOCATIONS[1], order: 0 },
      { ...DEFAULT_LOCATIONS[0], order: 1 },
    ]);
    expect(moveLocation(tree, "desk", -1).map((l) => [l.id, l.order])).toEqual([
      ["desk", 0],
      ["drawer1", 1],
    ]);
  });

  it("맨 앞에서 위로, 맨 뒤에서 아래로는 움직이지 않는다", () => {
    expect(moveLocation(tree, "room", -1)).toEqual([]);
    expect(moveLocation(tree, "bathroom", 1)).toEqual([]);
  });

  it("getDeleteBlockers는 직속 하위 위치와 그 위치의 재고 수를 센다", () => {
    const items = [item("a", "room", "x"), item("b", "slot2", "x")];
    expect(getDeleteBlockers(tree, items, "room")).toEqual({
      children: 2,
      items: 1,
    });
    expect(getDeleteBlockers(tree, items, "kitchen")).toEqual({
      children: 0,
      items: 0,
    });
  });
});
