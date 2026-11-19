"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import ItemRow from "@/components/ItemRow";
import {
  flattenTree,
  getItemsInLocation,
  getLocationPath,
  getRootId,
} from "@/core/location";
import { SORT_OPTIONS, sortItems, toSortKey } from "@/core/sort";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

function ItemList() {
  const router = useRouter();
  const params = useSearchParams();
  const loc = params.get("loc") ?? "";
  const sort = toSortKey(params.get("sort"));
  const loaded = useLoadInventory();
  const locations = useInventory((s) => s.locations);
  const allItems = useInventory((s) => s.items);
  const items = sortItems(getItemsInLocation(allItems, locations, loc), sort);
  const exists = locations.some((l) => l.id === loc);
  const today = new Date().toLocaleDateString("sv-SE"); // 로컬 YYYY-MM-DD
  const sortQuery = sort === "created" ? "" : `&sort=${sort}`;

  // 하위 위치 칩: 이 위치가 속한 방의 [전체] + 모든 하위 위치. 누르면 loc가 바뀐다
  const rootId = getRootId(locations, loc);
  const rootPath = getLocationPath(locations, rootId);
  const chips = exists
    ? [
        { id: rootId, label: "전체" },
        ...flattenTree(locations, rootId).map((l) => ({
          id: l.id,
          // "방 > 1번 서랍장 > 2칸" → "1번 서랍장 > 2칸"
          label: getLocationPath(locations, l.id).slice(rootPath.length + 3),
        })),
      ]
    : [];

  return (
    <>
      <Header
        title={exists ? getLocationPath(locations, loc) : "재고 목록"}
        backHref="/"
        action={
          exists && (
            <Link
              href={`/item/new/?loc=${loc}`}
              className="flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-on-primary"
            >
              + 등록
            </Link>
          )
        }
      />
      {chips.length > 1 && (
        <nav
          aria-label="하위 위치"
          className="flex gap-2 overflow-x-auto border-b border-line px-4 py-2"
        >
          {chips.map((c) => {
            const selected = c.id === loc;
            return (
              <Link
                key={c.id}
                replace
                href={`/list/?loc=${c.id}${sortQuery}`}
                aria-current={selected ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm ${
                  selected
                    ? "border-primary bg-primary font-semibold text-on-primary"
                    : "border-line-strong"
                }`}
              >
                {selected && "✓ "}
                {c.label}
              </Link>
            );
          })}
        </nav>
      )}
      {!loaded ? (
        <p className="p-4">불러오는 중…</p>
      ) : !exists ? (
        <p className="p-4">위치를 찾을 수 없습니다.</p>
      ) : items.length === 0 ? (
        <p className="p-4 text-muted">
          등록된 재고가 없습니다. 오른쪽 위 &lsquo;+ 등록&rsquo;으로 추가하세요.
        </p>
      ) : (
        <>
          <div className="flex justify-end border-b border-line px-4 py-2">
            <label className="flex items-center gap-2 text-sm">
              정렬
              <select
                className="min-h-11 rounded-lg border border-line-strong px-2 text-base"
                value={sort}
                onChange={(e) => {
                  const v = e.target.value;
                  // 뒤로가기가 정렬 변경마다 쌓이지 않게 replace
                  router.replace(
                    `/list/?loc=${loc}${v === "created" ? "" : `&sort=${v}`}`,
                  );
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                href={`/item/edit/?id=${item.id}`}
                path={
                  item.locationId !== loc
                    ? getLocationPath(locations, item.locationId)
                    : undefined
                }
                today={today}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ItemList />
    </Suspense>
  );
}
