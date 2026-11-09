"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createIdbAdapter, type StorageAdapter } from "@/core/storage";
import type { Item, ItemInput, Location } from "@/core/types";

// 빌드(프리렌더) 중에는 indexedDB가 없으므로 처음 쓸 때 연다
let adapter: StorageAdapter | undefined;
const db = () => (adapter ??= createIdbAdapter());

interface InventoryState {
  loaded: boolean;
  locations: Location[];
  items: Item[];
  load: () => Promise<void>;
  addItem: (input: ItemInput) => Promise<Item>;
  updateItem: (id: string, patch: Partial<ItemInput>) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventory = create<InventoryState>()((set, get) => ({
  loaded: false,
  locations: [],
  items: [],
  async load() {
    if (get().loaded) return;
    const [locations, items] = await Promise.all([
      db().getLocations(),
      db().getItems(),
    ]);
    set({ loaded: true, locations, items });
  },
  // 저장 성공 후에만 스토어 갱신
  async addItem(input) {
    const item = await db().addItem(input);
    set({ items: [...get().items, item] });
    return item;
  },
  async updateItem(id, patch) {
    const item = await db().updateItem(id, patch);
    set({ items: get().items.map((i) => (i.id === id ? item : i)) });
    return item;
  },
  async deleteItem(id) {
    await db().deleteItem(id);
    set({ items: get().items.filter((i) => i.id !== id) });
  },
}));

/** 화면 진입 시 IndexedDB에서 한 번 불러온다 */
export function useLoadInventory() {
  const load = useInventory((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);
  return useInventory((s) => s.loaded);
}
