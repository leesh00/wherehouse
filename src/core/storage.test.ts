import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createIdbAdapter } from "./storage";
import type { ItemInput } from "./types";

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

  it("없는 재고를 수정하면 에러가 난다", async () => {
    await expect(
      freshAdapter().updateItem("none", { quantity: 1 }),
    ).rejects.toThrow();
  });
});
