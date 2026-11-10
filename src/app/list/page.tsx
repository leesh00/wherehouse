"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import ItemRow from "@/components/ItemRow";
import { getItemsInLocation, getLocationPath } from "@/core/location";
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

  return (
    <>
      <Header
        title={exists ? getLocationPath(locations, loc) : "재고 목록"}
        backHref="/"
        action={
          exists && (
            <Link
              href={`/item/new/?loc=${loc}`}
              className="flex min-h-11 items-center rounded-lg bg-zinc-900 px-4 font-semibold text-white"
            >
              + 등록
            </Link>
          )
        }
      />
      {!loaded ? (
        <p className="p-4">불러오는 중…</p>
      ) : !exists ? (
        <p className="p-4">위치를 찾을 수 없습니다.</p>
      ) : items.length === 0 ? (
        <p className="p-4 text-zinc-600">
          등록된 재고가 없습니다. 오른쪽 위 &lsquo;+ 등록&rsquo;으로 추가하세요.
        </p>
      ) : (
        <>
          <div className="flex justify-end border-b border-zinc-200 px-4 py-2">
            <label className="flex items-center gap-2 text-sm">
              정렬
              <select
                className="min-h-11 rounded-lg border border-zinc-300 px-2 text-base"
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
          <ul className="divide-y divide-zinc-200">
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
