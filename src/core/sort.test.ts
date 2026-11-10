import { describe, expect, it } from "vitest";
import { sortItems, toSortKey } from "./sort";
import type { Item } from "./types";

const item = (
  name: string,
  createdAt: string,
  quantity: number,
  expiresAt?: string,
) => ({ name, createdAt, quantity, expiresAt }) as Item;

const items = [
  item("다", "2026-11-01", 3, "2026-12-01"),
  item("나", "2026-11-02", 1),
  item("가", "2026-11-03", 3, "2026-12-01"),
  item("라", "2026-11-04", 0, "2026-11-05"),
];
const names = (list: Item[]) => list.map((i) => i.name);

describe("sortItems", () => {
  it("등록순", () => {
    expect(names(sortItems(items, "created"))).toEqual([
      "다",
      "나",
      "가",
      "라",
    ]);
  });

  it("유통기한 임박순: 빠른 날짜 먼저, 같으면 이름순, 없으면 맨 뒤", () => {
    expect(names(sortItems(items, "expiry"))).toEqual(["라", "가", "다", "나"]);
  });

  it("수량 적은순: 같으면 이름순", () => {
    expect(names(sortItems(items, "quantity"))).toEqual([
      "라",
      "나",
      "가",
      "다",
    ]);
  });

  it("원본 배열은 바꾸지 않는다", () => {
    const copy = [...items];
    sortItems(items, "quantity");
    expect(items).toEqual(copy);
  });
});

describe("toSortKey", () => {
  it("모르는 값이나 없으면 등록순", () => {
    expect(toSortKey(null)).toBe("created");
    expect(toSortKey("abc")).toBe("created");
    expect(toSortKey("expiry")).toBe("expiry");
  });
});
