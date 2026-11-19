"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
  createLocation,
  getDeleteBlockers,
  moveLocation as getMovedLocations,
} from "@/core/location";
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
  addLocation: (name: string, parentId: string | null) => Promise<void>;
  renameLocation: (id: string, name: string) => Promise<void>;
  moveLocation: (id: string, dir: -1 | 1) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  importData: (locations: Location[], items: Item[]) => Promise<void>;
}

// 바뀐 위치들을 id 기준으로 덮어쓴다 (없던 id는 추가)
const mergeLocations = (all: Location[], changed: Location[]) => [
  ...all.filter((l) => !changed.some((c) => c.id === l.id)),
  ...changed,
];

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
  async addLocation(name, parentId) {
    const loc = createLocation(get().locations, name, parentId);
    await db().putLocations([loc]);
    set({ locations: mergeLocations(get().locations, [loc]) });
  },
  async renameLocation(id, name) {
    const loc = get().locations.find((l) => l.id === id);
    if (!loc) return;
    const renamed = { ...loc, name: name.trim() };
    await db().putLocations([renamed]);
    set({ locations: mergeLocations(get().locations, [renamed]) });
  },
  async moveLocation(id, dir) {
    const changed = getMovedLocations(get().locations, id, dir);
    if (!changed.length) return;
    await db().putLocations(changed);
    set({ locations: mergeLocations(get().locations, changed) });
  },
  async deleteLocation(id) {
    // 화면에서 막더라도 저장 직전에 한 번 더 확인 (하위 위치·재고가 고아가 되지 않게)
    const { children, items } = getDeleteBlockers(
      get().locations,
      get().items,
      id,
    );
    if (children || items)
      throw new Error("하위 위치나 재고가 있는 위치는 삭제할 수 없습니다");
    await db().deleteLocation(id);
    set({ locations: get().locations.filter((l) => l.id !== id) });
  },
  async importData(locations, items) {
    await db().replaceAll(locations, items);
    set({ locations, items });
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
