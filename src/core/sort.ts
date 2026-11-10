import type { Item } from "./types";

export const SORT_OPTIONS = [
  { value: "created", label: "등록순" },
  { value: "expiry", label: "유통기한 임박순" },
  { value: "quantity", label: "수량 적은순" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const toSortKey = (v: string | null): SortKey =>
  SORT_OPTIONS.find((o) => o.value === v)?.value ?? "created";

const byName = (a: Item, b: Item) => a.name.localeCompare(b.name, "ko");

/** 정렬. 유통기한·수량이 같으면 이름순, 유통기한 없는 재고는 맨 뒤 */
export function sortItems(items: Item[], sort: SortKey): Item[] {
  const list = [...items];
  if (sort === "created") {
    return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  if (sort === "quantity") {
    return list.sort((a, b) => a.quantity - b.quantity || byName(a, b));
  }
  return list.sort((a, b) => {
    if (a.expiresAt === b.expiresAt) return byName(a, b);
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return a.expiresAt.localeCompare(b.expiresAt) || byName(a, b);
  });
}
