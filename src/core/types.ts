export interface Location {
  id: string;
  name: string;
  parentId: string | null;
  depth: number; // 0(방) ~ 2
  order: number;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  locationId: string;
  quantity: number;
  unit: string;
  purchasedAt: string; // ISO
  expiresAt?: string; // ISO, 선택
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemInput = Omit<Item, "id" | "createdAt" | "updatedAt">;

export type Theme = "light" | "dark";

/** 임시 가구 종류. 그림은 나중에 이 값으로 고른다 (007) */
export type FurnitureKind =
  "fridge" | "drawer" | "wardrobe" | "shelf" | "cabinet" | "etc";

/**
 * 위치의 화면 배치 (격자 칸 단위, 1칸 = 50cm).
 * 방(depth 0)은 집 안 좌표, 가구(depth 1)는 자기 방 안 좌표. 가구 안 칸(depth 2)은 배치 없음
 */
export interface Placement {
  locationId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: FurnitureKind; // 가구만
}
