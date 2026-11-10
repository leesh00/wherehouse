import type { Item } from "./types";

/** 이름·분류·메모 부분 일치(대소문자 무시). 등록순. 빈 검색어면 빈 배열 */
export function searchItems(items: Item[], query: string): Item[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items
    .filter((i) =>
      [i.name, i.category, i.memo].some((f) => f.toLowerCase().includes(q)),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
