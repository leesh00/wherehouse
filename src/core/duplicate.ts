import type { Item } from "./types";

const normalize = (s: string) => s.trim().toLowerCase();

/** 이름이 같은 재고(앞뒤 공백·대소문자 무시, 모든 위치). 빈 이름이면 빈 배열 */
export function findDuplicates(items: Item[], name: string): Item[] {
  const n = normalize(name);
  if (!n) return [];
  return items.filter((i) => normalize(i.name) === n);
}
