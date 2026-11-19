import "fake-indexeddb/auto";
import { openDB } from "idb";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createIdbAdapter } from "./storage";
import type { Item, ItemInput } from "./types";

const input: ItemInput = {
  name: "휴지",
  category: "생활용품",
  locationId: "bathroom",
  quantity: 3,
  unit: "롤",
  purchasedAt: "2026-11-01T00:00:00.000Z",
  memo: "",
};

let n = 0;
const freshAdapter = () => createIdbAdapter(`test-${n++}`);

afterEach(() => {
  vi.useRealTimers();
});

describe("IndexedDB 저장소 어댑터", () => {
  it("처음 열면 기본 위치 3개(방, 부엌, 화장실)가 있다", async () => {
    const names = (await freshAdapter().getLocations()).map((l) => l.name);
    expect(names.sort()).toEqual(["방", "부엌", "화장실"].sort());
  });

  it("저장한 재고를 조회할 수 있다", async () => {
    const db = freshAdapter();
    const saved = await db.addItem(input);

    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBe(saved.updatedAt);
    expect(await db.getItem(saved.id)).toEqual(saved);
    expect(await db.getItems()).toEqual([saved]);
  });

  it("어댑터를 새로 만들어도(새로고침) 데이터가 유지된다", async () => {
    const name = `test-${n++}`;
    const saved = await createIdbAdapter(name).addItem(input);

    expect(await createIdbAdapter(name).getItem(saved.id)).toEqual(saved);
  });

  it("수정하면 바뀐 값과 updatedAt이 저장되고 id·createdAt은 유지된다", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-01T00:00:00.000Z"));
    const db = freshAdapter();
    const saved = await db.addItem(input);

    vi.setSystemTime(new Date("2026-11-02T00:00:00.000Z"));
    const updated = await db.updateItem(saved.id, {
      quantity: 1,
      locationId: "kitchen",
      expiresAt: "2027-01-01T00:00:00.000Z",
    });

    expect(updated).toMatchObject({
      id: saved.id,
      name: "휴지",
      quantity: 1,
      locationId: "kitchen",
      expiresAt: "2027-01-01T00:00:00.000Z",
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-02T00:00:00.000Z",
    });
    expect(await db.getItem(saved.id)).toEqual(updated);
  });

  it("삭제한 재고는 조회되지 않고, 새로 열어도 남지 않는다", async () => {
    const name = `test-${n++}`;
    const db = createIdbAdapter(name);
    const keep = await db.addItem(input);
    const gone = await db.addItem({ ...input, name: "치약" });

    await db.deleteItem(gone.id);

    expect(await db.getItem(gone.id)).toBeUndefined();
    expect(await createIdbAdapter(name).getItems()).toEqual([keep]);
  });

  it("위치를 추가·수정·삭제하면 새로 열어도 반영돼 있다", async () => {
    const name = `test-${n++}`;
    const db = createIdbAdapter(name);
    const shelf = {
      id: "shelf",
      name: "선반",
      parentId: "kitchen",
      depth: 1,
      order: 0,
    };
    await db.putLocations([shelf]);
    await db.putLocations([
      { ...shelf, name: "찬장" },
      { id: "room", name: "안방", parentId: null, depth: 0, order: 0 },
    ]);
    await db.deleteLocation("bathroom");

    const names = (await createIdbAdapter(name).getLocations())
      .map((l) => l.name)
      .sort();
    expect(names).toEqual(["부엌", "안방", "찬장"].sort());
  });

  it("화면 모드는 고른 적 없으면 null, 저장하면 새로 열어도 유지된다", async () => {
    const name = `test-${n++}`;
    expect(await createIdbAdapter(name).getTheme()).toBeNull();
    await createIdbAdapter(name).setTheme("dark");
    expect(await createIdbAdapter(name).getTheme()).toBe("dark");
  });

  it("버전 1 DB를 열면 기존 위치·재고를 그대로 두고 설정 저장소만 추가한다", async () => {
    const name = `test-${n++}`;
    // 1차~2차 초반에 쓰던 버전 1 구조를 직접 만든다
    const v1 = await openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore("locations", { keyPath: "id" }).put({
          id: "room",
          name: "안방",
          parentId: null,
          depth: 0,
          order: 0,
        });
        db.createObjectStore("items", { keyPath: "id" }).put({
          ...input,
          id: "old",
          createdAt: "2026-11-01T00:00:00.000Z",
          updatedAt: "2026-11-01T00:00:00.000Z",
        });
      },
    });
    v1.close();

    const db = createIdbAdapter(name);
    expect((await db.getLocations()).map((l) => l.name)).toEqual(["안방"]);
    expect((await db.getItems()).map((i) => i.id)).toEqual(["old"]);
    await db.setTheme("light");
    expect(await db.getTheme()).toBe("light");
  });

  it("replaceAll은 기존 위치·재고를 모두 지우고 바꾼다", async () => {
    const name = `test-${n++}`;
    const db = createIdbAdapter(name);
    await db.addItem(input);
    const veranda = {
      id: "veranda",
      name: "베란다",
      parentId: null,
      depth: 0,
      order: 0,
    };
    const imported = {
      ...input,
      id: "imported",
      locationId: "veranda",
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
    };

    await db.replaceAll([veranda], [imported]);

    const reopened = createIdbAdapter(name);
    expect(await reopened.getLocations()).toEqual([veranda]);
    expect(await reopened.getItems()).toEqual([imported]);
  });

  it("replaceAll 중 하나라도 실패하면 아무것도 바뀌지 않는다", async () => {
    const name = `test-${n++}`;
    const db = createIdbAdapter(name);
    const kept = await db.addItem(input);

    // id(keyPath)가 없는 재고는 저장에 실패한다
    await expect(
      db.replaceAll([], [{ ...input } as unknown as Item]),
    ).rejects.toThrow();

    const reopened = createIdbAdapter(name);
    expect(await reopened.getItems()).toEqual([kept]);
    expect(await reopened.getLocations()).toHaveLength(3);
  });

  it("없는 재고를 수정하면 에러가 난다", async () => {
    await expect(
      freshAdapter().updateItem("none", { quantity: 1 }),
    ).rejects.toThrow();
  });
});
