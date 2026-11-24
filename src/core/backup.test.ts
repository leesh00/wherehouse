import { describe, expect, it } from "vitest";
import { backupFileName, buildBackup, parseBackup } from "./backup";
import { DEFAULT_LOCATIONS } from "./location";
import type { Item, Location, Placement } from "./types";

const drawer: Location = {
  id: "drawer",
  name: "서랍장",
  parentId: "room",
  depth: 1,
  order: 0,
};
const item = (id: string, locationId: string): Item => ({
  id,
  name: `재고${id}`,
  category: "",
  locationId,
  quantity: 1,
  unit: "개",
  purchasedAt: "2026-11-01T00:00:00.000Z",
  memo: "",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
});
const locations = [...DEFAULT_LOCATIONS, drawer];
const items = [item("1", "drawer"), item("2", "kitchen")];
const json = (data: unknown) => JSON.stringify(data);

describe("buildBackup / parseBackup", () => {
  it("내보낸 파일을 그대로 다시 읽을 수 있다", () => {
    const layout: Placement[] = [
      { locationId: "room", x: 0, y: 0, w: 6, h: 5 },
      { locationId: "drawer", x: 1, y: 0, w: 2, h: 1, kind: "drawer" },
    ];
    const backup = buildBackup(locations, items, layout);
    expect(parseBackup(json(backup))).toEqual({
      locations,
      items,
      layout,
      total: { locations: 4, items: 2 },
    });
  });

  it("버전 1(배치 없음) 파일도 읽는다", () => {
    const v1 = { ...buildBackup(locations, items), version: 1 } as Partial<
      ReturnType<typeof buildBackup>
    >;
    delete v1.layout;
    const parsed = parseBackup(json(v1));
    expect(parsed.items).toEqual(items);
    expect(parsed.layout).toEqual([]);
  });

  it("틀린 배치는 조용히 빼고, 종류가 틀린 가구는 기타로", () => {
    const room = { locationId: "room", x: 0, y: 0, w: 6, h: 5 };
    const parsed = parseBackup(
      json(
        buildBackup(
          [
            ...locations,
            { id: "slot", name: "칸", parentId: "drawer", depth: 2, order: 0 },
          ],
          [],
          [
            { ...room, locationId: "drawer", x: 0, kind: "sofa" }, // 방보다 먼저 와도 됨
            room,
            { ...room, locationId: "kitchen", x: 20 }, // 집 밖으로 나감
            { ...room, locationId: "bathroom", w: 0 }, // 크기 0
            { ...room, locationId: "gone" }, // 없는 위치
            { ...room, locationId: "slot", w: 1, h: 1 }, // 칸은 배치 없음
            { ...room, x: 6 }, // 중복
          ] as Placement[],
        ),
      ),
    );
    expect(parsed.layout).toEqual([
      room,
      { ...room, locationId: "drawer", kind: "etc" },
    ]);
  });

  it("파일 이름은 wherehouse-로컬날짜.json", () => {
    expect(backupFileName(new Date(2026, 10, 19, 23, 30))).toBe(
      "wherehouse-2026-11-19.json",
    );
  });

  it("JSON이 아니거나 형식·버전이 다르면 에러", () => {
    expect(() => parseBackup("{abc")).toThrow("JSON");
    expect(() => parseBackup(json({ items: [] }))).toThrow("형식");
    expect(() =>
      parseBackup(json({ ...buildBackup([], []), version: 99 })),
    ).toThrow("버전");
  });

  it("잘못된 위치와 그 하위·그 안의 재고는 빼고 나머지만 돌려준다", () => {
    const backup = buildBackup(
      [
        ...DEFAULT_LOCATIONS,
        { ...drawer, depth: 2 }, // depth가 부모와 안 맞음
        { id: "slot", name: "칸", parentId: "drawer", depth: 2, order: 0 }, // 부모가 빠짐
        { id: "x", name: "", parentId: null, depth: 0, order: 9 }, // 빈 이름
      ],
      [
        item("1", "drawer"),
        item("2", "kitchen"),
        item("3", "slot"),
        { ...item("4", "room"), quantity: -1 },
        { ...item("5", "room"), purchasedAt: "어제" },
        item("2", "room"), // 중복 id
      ],
    );
    const parsed = parseBackup(json(backup));
    expect(parsed.locations.map((l) => l.id)).toEqual([
      "room",
      "kitchen",
      "bathroom",
    ]);
    expect(parsed.items.map((i) => i.id)).toEqual(["2"]);
    expect(parsed.total).toEqual({ locations: 6, items: 6 });
  });

  it("분류·단위·메모가 없으면 빈 문자열, 유통기한은 있을 때만", () => {
    const bare: Partial<Item> = item("1", "room");
    delete bare.category;
    delete bare.unit;
    delete bare.memo;
    const parsed = parseBackup(
      json(
        buildBackup(DEFAULT_LOCATIONS, [
          bare as Item,
          { ...item("2", "room"), expiresAt: "2026-12-01T00:00:00.000Z" },
        ]),
      ),
    );
    expect(parsed.items[0]).toMatchObject({ category: "", unit: "", memo: "" });
    expect("expiresAt" in parsed.items[0]).toBe(false);
    expect(parsed.items[1].expiresAt).toBe("2026-12-01T00:00:00.000Z");
  });
});
