import { describe, expect, it } from "vitest";
import { searchItems } from "./search";
import type { Item } from "./types";

const item = (
  name: string,
  category: string,
  memo: string,
  createdAt: string,
) => ({ name, category, memo, createdAt }) as Item;

const items = [
  item("치약", "생활용품", "", "2026-11-03"),
  item("Shampoo", "욕실", "", "2026-11-01"),
  item("라면", "식품", "치즈라면 아님", "2026-11-02"),
  item("휴지", "생활용품", "", "2026-11-04"),
];
const names = (list: Item[]) => list.map((i) => i.name);

describe("searchItems", () => {
  it("이름·분류·메모에서 부분 일치로 찾고 등록순으로 돌려준다", () => {
    expect(names(searchItems(items, "치"))).toEqual(["라면", "치약"]);
    expect(names(searchItems(items, "생활"))).toEqual(["치약", "휴지"]);
  });

  it("대소문자와 앞뒤 공백을 무시한다", () => {
    expect(names(searchItems(items, "  shAM "))).toEqual(["Shampoo"]);
  });

  it("빈 검색어는 빈 결과", () => {
    expect(searchItems(items, "   ")).toEqual([]);
  });
});
