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
