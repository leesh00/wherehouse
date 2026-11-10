"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import { getExpiryLabel, type ExpiryLabel } from "@/core/expiry";
import { getItemsInLocation, getLocationPath } from "@/core/location";
import { SORT_OPTIONS, sortItems, toSortKey } from "@/core/sort";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

// 색과 함께 문구로도 상태를 구분한다
const badgeStyle: Record<ExpiryLabel["kind"], string> = {
  expired: "rounded bg-red-100 px-1.5 font-semibold text-red-800",
  today: "rounded bg-amber-100 px-1.5 font-semibold text-amber-900",
  soon: "rounded bg-amber-100 px-1.5 font-semibold text-amber-900",
  later: "text-zinc-500",
};

function ExpiryBadge({
  expiresAt,
  today,
}: {
  expiresAt?: string;
  today: string;
}) {
  const label = getExpiryLabel(expiresAt, today);
  if (!label) return null;
  return (
    <span className={`shrink-0 text-xs ${badgeStyle[label.kind]}`}>
      {label.text}
    </span>
  );
}

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
              <li key={item.id}>
                <Link
                  href={`/item/edit/?id=${item.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                      <span className="truncate font-medium">{item.name}</span>
                      <ExpiryBadge expiresAt={item.expiresAt} today={today} />
                    </p>
                    <p className="truncate text-sm text-zinc-600">
                      {[
                        item.locationId !== loc &&
                          getLocationPath(locations, item.locationId),
                        item.category,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {item.quantity}
                    {item.unit}
                  </span>
                </Link>
              </li>
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
