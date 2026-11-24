import { openDB, type DBSchema } from "idb";
import { DEFAULT_LOCATIONS } from "./location";
import type { Item, ItemInput, Location, Placement, Theme } from "./types";

export interface StorageAdapter {
  getLocations(): Promise<Location[]>;
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  addItem(input: ItemInput): Promise<Item>;
  updateItem(id: string, patch: Partial<ItemInput>): Promise<Item>;
  deleteItem(id: string): Promise<void>;
  /** 추가·수정 모두. 여러 개를 한 트랜잭션으로 (순서 바꾸기는 두 개가 함께 바뀜) */
  putLocations(locations: Location[]): Promise<void>;
  deleteLocation(id: string): Promise<void>;
  /** 모든 위치·재고·배치를 지우고 주어진 것으로 바꾼다. 한 트랜잭션이라 실패하면 그대로 남는다 */
  replaceAll(
    locations: Location[],
    items: Item[],
    layout?: Placement[],
  ): Promise<void>;
  getLayout(): Promise<Placement[]>;
  /** 배치 전체를 바꾼다 (한 트랜잭션) */
  setLayout(layout: Placement[]): Promise<void>;
  /** 사용자가 고른 화면 모드. 고른 적 없으면 null(시스템 설정을 따름) */
  getTheme(): Promise<Theme | null>;
  setTheme(theme: Theme): Promise<void>;
}

interface WhereHouseDB extends DBSchema {
  locations: { key: string; value: Location };
  items: { key: string; value: Item };
  settings: { key: string; value: unknown };
  layout: { key: string; value: Placement };
}

/**
 * 요청을 모두 보낸 뒤 끝날 때까지 기다린다. 하나라도 실패하면 트랜잭션 전체를 취소한다.
 * put이 동기로 throw하면(예: keyPath 없음) 트랜잭션이 자동 취소되지 않고
 * 이미 요청한 clear()만 커밋되므로 직접 취소해 기존 데이터를 지킨다
 */
async function runAtomic(
  tx: { done: Promise<void>; abort(): void },
  write: (pending: Promise<unknown>[]) => void,
) {
  const pending: Promise<unknown>[] = [tx.done];
  try {
    write(pending);
    await Promise.all(pending);
  } catch (err) {
    try {
      tx.abort();
    } catch {
      // 이미 끝났거나 취소된 트랜잭션
    }
    await Promise.allSettled(pending); // 취소로 실패한 요청들을 처리해 둔다
    throw err;
  }
}

export function createIdbAdapter(dbName = "wherehouse"): StorageAdapter {
  // 버전을 올릴 때는 이전 버전에서 없던 것만 만든다 (기존 데이터 유지)
  const db = openDB<WhereHouseDB>(dbName, 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const locations = db.createObjectStore("locations", {
          keyPath: "id",
        });
        db.createObjectStore("items", { keyPath: "id" });
        for (const loc of DEFAULT_LOCATIONS) locations.put(loc);
      }
      if (oldVersion < 2) db.createObjectStore("settings");
      if (oldVersion < 3)
        db.createObjectStore("layout", { keyPath: "locationId" });
    },
  });

  return {
    async getTheme() {
      const v = await (await db).get("settings", "theme");
      return v === "light" || v === "dark" ? v : null;
    },
    async setTheme(theme) {
      await (await db).put("settings", theme, "theme");
    },
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
    async deleteItem(id) {
      await (await db).delete("items", id);
    },
    async putLocations(locations) {
      const tx = (await db).transaction("locations", "readwrite");
      await Promise.all([...locations.map((l) => tx.store.put(l)), tx.done]);
    },
    async deleteLocation(id) {
      await (await db).delete("locations", id);
    },
    async replaceAll(locations, items, layout = []) {
      const tx = (await db).transaction(
        ["locations", "items", "layout"],
        "readwrite",
      );
      const stores = {
        locations: tx.objectStore("locations"),
        items: tx.objectStore("items"),
        layout: tx.objectStore("layout"),
      };
      await runAtomic(tx, (pending) => {
        for (const s of Object.values(stores)) pending.push(s.clear());
        for (const l of locations) pending.push(stores.locations.put(l));
        for (const i of items) pending.push(stores.items.put(i));
        for (const p of layout) pending.push(stores.layout.put(p));
      });
    },
    async getLayout() {
      return (await db).getAll("layout");
    },
    async setLayout(layout) {
      const tx = (await db).transaction("layout", "readwrite");
      await runAtomic(tx, (pending) => {
        pending.push(tx.store.clear());
        for (const p of layout) pending.push(tx.store.put(p));
      });
    },
  };
}
