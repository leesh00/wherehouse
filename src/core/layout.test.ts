import { describe, expect, it } from "vitest";
import { autoPlace, findFreeSpot, fitsIn, HOUSE, overlaps } from "./layout";
import { DEFAULT_LOCATIONS } from "./location";
import type { Location, Placement } from "./types";

const room = (id: string, order = 0): Location => ({
  id,
  name: id,
  parentId: null,
  depth: 0,
  order,
});
const child = (id: string, parentId: string, depth = 1): Location => ({
  id,
  name: id,
  parentId,
  depth,
  order: 0,
});

describe("overlaps / fitsIn", () => {
  it("변만 맞붙으면 겹침이 아니다", () => {
    const a = { x: 0, y: 0, w: 2, h: 2 };
    expect(overlaps(a, { x: 2, y: 0, w: 2, h: 2 })).toBe(false);
    expect(overlaps(a, { x: 1, y: 1, w: 2, h: 2 })).toBe(true);
  });

  it("영역 밖으로 나가면 false", () => {
    expect(fitsIn({ x: 22, y: 0, w: 2, h: 2 }, HOUSE)).toBe(true);
    expect(fitsIn({ x: 23, y: 0, w: 2, h: 2 }, HOUSE)).toBe(false);
    expect(fitsIn({ x: -1, y: 0, w: 1, h: 1 }, HOUSE)).toBe(false);
  });
});

describe("findFreeSpot", () => {
  it("위→아래, 왼쪽→오른쪽 순서로 첫 빈 자리", () => {
    const taken = [{ x: 0, y: 0, w: 2, h: 1 }];
    expect(findFreeSpot(taken, { w: 1, h: 1 }, { w: 3, h: 2 })).toEqual({
      x: 2,
      y: 0,
      w: 1,
      h: 1,
    });
  });

  it("자리가 없으면 null", () => {
    expect(
      findFreeSpot(
        [{ x: 0, y: 0, w: 2, h: 2 }],
        { w: 1, h: 1 },
        { w: 2, h: 2 },
      ),
    ).toBeNull();
  });
});

describe("autoPlace", () => {
  it("기본 방 3개를 왼쪽부터 6×5로 나란히 놓는다", () => {
    expect(autoPlace(DEFAULT_LOCATIONS, [])).toEqual([
      { locationId: "room", x: 0, y: 0, w: 6, h: 5 },
      { locationId: "kitchen", x: 6, y: 0, w: 6, h: 5 },
      { locationId: "bathroom", x: 12, y: 0, w: 6, h: 5 },
    ]);
  });

  it("가구는 자기 방 안 빈 자리에 1×1 기타로, 칸(depth 2)은 놓지 않는다", () => {
    const locations = [
      room("a"),
      child("d1", "a"),
      child("d2", "a"),
      child("slot", "d1", 2),
    ];
    const layout: Placement[] = [
      { locationId: "a", x: 3, y: 3, w: 2, h: 2 },
      { locationId: "d1", x: 0, y: 0, w: 1, h: 1, kind: "drawer" },
    ];
    expect(autoPlace(locations, layout)).toEqual([
      ...layout,
      { locationId: "d2", x: 1, y: 0, w: 1, h: 1, kind: "etc" },
    ]);
  });

  it("없어진 위치와 칸의 배치는 버린다", () => {
    const locations = [room("a"), child("d1", "a"), child("slot", "d1", 2)];
    const keep: Placement = { locationId: "a", x: 0, y: 0, w: 6, h: 5 };
    const furniture: Placement = { locationId: "d1", x: 0, y: 0, w: 1, h: 1 };
    expect(
      autoPlace(locations, [
        keep,
        furniture,
        { locationId: "gone", x: 6, y: 0, w: 6, h: 5 },
        { locationId: "slot", x: 0, y: 0, w: 1, h: 1 },
      ]),
    ).toEqual([keep, furniture]);
  });

  it("기본 크기 자리가 없으면 최소 크기(2×2), 그것도 없으면 놓지 않는다", () => {
    const full: Placement = { locationId: "big", x: 0, y: 0, w: 24, h: 14 };
    const locations = [room("big"), room("b", 1), room("c", 2)];
    const r = autoPlace(locations, [full]);
    expect(r.slice(1)).toEqual([
      { locationId: "b", x: 0, y: 14, w: 2, h: 2 },
      { locationId: "c", x: 2, y: 14, w: 2, h: 2 },
    ]);

    const packed: Placement = { ...full, h: 16 };
    expect(autoPlace(locations, [packed])).toEqual([packed]);
  });

  it("바뀐 게 없으면 같은 배열을 돌려준다", () => {
    const layout = autoPlace(DEFAULT_LOCATIONS, []);
    expect(autoPlace(DEFAULT_LOCATIONS, layout)).toBe(layout);
  });
});
