import { MAX_DEPTH } from "./location";
import type { Item, Location } from "./types";

export const BACKUP_VERSION = 1;

export interface Backup {
  app: "wherehouse";
  version: number;
  exportedAt: string;
  locations: Location[];
  items: Item[];
}

export function buildBackup(
  locations: Location[],
  items: Item[],
  now = new Date(),
): Backup {
  return {
    app: "wherehouse",
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    locations,
    items,
  };
}

/** wherehouse-YYYY-MM-DD.json (로컬 날짜) */
export const backupFileName = (now = new Date()) =>
  `wherehouse-${now.toLocaleDateString("sv-SE")}.json`;

export interface ParsedBackup {
  locations: Location[];
  items: Item[];
  total: { locations: number; items: number }; // 파일에 있던 개수
}

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown) => isStr(v) && !Number.isNaN(Date.parse(v));

/**
 * 백업 파일 내용을 검사해 올바른 위치·재고만 돌려준다.
 * - 위치: 부모가 올바른 위치여야 하고 depth = 부모 depth + 1 (최상위는 0)
 * - 재고: 필수 필드가 맞고, 올바른 위치를 가리켜야 한다
 * - 같은 id가 여러 번 나오면 처음 것만
 * 파일 자체를 읽을 수 없으면(JSON 아님, 형식 다름) 에러
 */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSON 파일이 아닙니다.");
  }
  if (
    !isRec(data) ||
    data.app !== "wherehouse" ||
    !Array.isArray(data.locations) ||
    !Array.isArray(data.items)
  ) {
    throw new Error("WhereHouse 백업 파일 형식이 아닙니다.");
  }
  if (data.version !== BACKUP_VERSION) {
    throw new Error(`지원하지 않는 백업 버전입니다: ${String(data.version)}`);
  }

  const candidates = data.locations.filter(
    (l): l is Rec =>
      isRec(l) &&
      isStr(l.id) &&
      l.id !== "" &&
      isStr(l.name) &&
      l.name.trim() !== "" &&
      (l.parentId === null || isStr(l.parentId)) &&
      Number.isInteger(l.depth) &&
      typeof l.order === "number",
  );

  // 위에서부터(depth 0 → 2) 부모가 이미 통과한 위치만 받는다
  const valid = new Map<string, Location>();
  for (let depth = 0; depth <= MAX_DEPTH; depth++) {
    for (const l of candidates) {
      if (l.depth !== depth || valid.has(l.id as string)) continue;
      const parent =
        l.parentId === null ? null : valid.get(l.parentId as string);
      const ok =
        l.parentId === null ? depth === 0 : parent?.depth === depth - 1;
      if (!ok) continue;
      valid.set(l.id as string, {
        id: l.id as string,
        name: (l.name as string).trim(),
        parentId: l.parentId as string | null,
        depth,
        order: l.order as number,
      });
    }
  }

  const seenItems = new Set<string>();
  const items: Item[] = [];
  for (const i of data.items) {
    if (
      !isRec(i) ||
      !isStr(i.id) ||
      i.id === "" ||
      seenItems.has(i.id) ||
      !isStr(i.name) ||
      i.name.trim() === "" ||
      !isStr(i.locationId) ||
      !valid.has(i.locationId) ||
      typeof i.quantity !== "number" ||
      !Number.isFinite(i.quantity) ||
      i.quantity < 0 ||
      !isDate(i.purchasedAt) ||
      !(i.expiresAt === undefined || isDate(i.expiresAt)) ||
      !isDate(i.createdAt) ||
      !isDate(i.updatedAt)
    )
      continue;
    seenItems.add(i.id);
    items.push({
      id: i.id,
      name: i.name.trim(),
      category: isStr(i.category) ? i.category : "",
      locationId: i.locationId,
      quantity: i.quantity,
      unit: isStr(i.unit) ? i.unit : "",
      purchasedAt: i.purchasedAt as string,
      ...(i.expiresAt !== undefined && { expiresAt: i.expiresAt as string }),
      memo: isStr(i.memo) ? i.memo : "",
      createdAt: i.createdAt as string,
      updatedAt: i.updatedAt as string,
    });
  }

  return {
    locations: [...valid.values()],
    items,
    total: { locations: data.locations.length, items: data.items.length },
  };
}
