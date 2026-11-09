import { openDB, type DBSchema } from "idb";
import { DEFAULT_LOCATIONS } from "./location";
import type { Item, ItemInput, Location } from "./types";

export interface StorageAdapter {
  getLocations(): Promise<Location[]>;
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  addItem(input: ItemInput): Promise<Item>;
  updateItem(id: string, patch: Partial<ItemInput>): Promise<Item>;
}

interface WhereHouseDB extends DBSchema {
  locations: { key: string; value: Location };
  items: { key: string; value: Item };
}

export function createIdbAdapter(dbName = "wherehouse"): StorageAdapter {
  const db = openDB<WhereHouseDB>(dbName, 1, {
    upgrade(db) {
      const locations = db.createObjectStore("locations", { keyPath: "id" });
      db.createObjectStore("items", { keyPath: "id" });
      for (const loc of DEFAULT_LOCATIONS) locations.put(loc);
    },
  });

  return {
    async getLocations() {
      return (await db).getAll("locations");
    },
    async getItems() {
      return (await db).getAll("items");
    },
    async getItem(id) {
      return (await db).get("items", id);
    },
    async addItem(input) {
      const now = new Date().toISOString();
      const item: Item = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      await (await db).add("items", item);
      return item;
    },
    async updateItem(id, patch) {
      const tx = (await db).transaction("items", "readwrite");
      const prev = await tx.store.get(id);
      if (!prev) throw new Error(`재고를 찾을 수 없습니다: ${id}`);
      const item: Item = {
        ...prev,
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
      };
      await tx.store.put(item);
      await tx.done;
      return item;
    },
  };
}
