import { describe, expect, it } from "vitest";
import { findDuplicates } from "./duplicate";
import type { Item } from "./types";

const item = (id: string, name: string) => ({ id, name }) as Item;
const items = [
  item("1", "휴지"),
  item("2", "Shampoo"),
  item("3", "휴지 "),
  item("4", "물티슈"),
];
const ids = (list: Item[]) => list.map((i) => i.id);

describe("findDuplicates", () => {
  it("이름이 같은 재고를 모두 찾는다 (앞뒤 공백 무시)", () => {
    expect(ids(findDuplicates(items, " 휴지"))).toEqual(["1", "3"]);
  });

  it("대소문자를 무시한다", () => {
    expect(ids(findDuplicates(items, "SHAMPOO"))).toEqual(["2"]);
  });

  it("부분 일치는 중복이 아니다", () => {
    expect(findDuplicates(items, "티슈")).toEqual([]);
  });

  it("빈 이름은 검사하지 않는다", () => {
    expect(findDuplicates(items, "  ")).toEqual([]);
  });
});
