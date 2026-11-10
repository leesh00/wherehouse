"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Header from "@/components/Header";
import ItemRow from "@/components/ItemRow";
import { getLocationPath } from "@/core/location";
import { searchItems } from "@/core/search";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

function Home() {
  const router = useRouter();
  // 입력은 로컬 상태로 받고 URL(?q=)에는 따라 적는다. URL을 입력값으로 직접 쓰면 한글 조합이 끊길 수 있다
  const [query, setQuery] = useState(useSearchParams().get("q") ?? "");
  const loaded = useLoadInventory();
  const locations = useInventory((s) => s.locations);
  const items = useInventory((s) => s.items);
  const rooms = locations
    .filter((l) => l.parentId === null)
    .sort((a, b) => a.order - b.order);
  const searching = query.trim() !== "";
  const results = searchItems(items, query);
  const today = new Date().toLocaleDateString("sv-SE"); // 로컬 YYYY-MM-DD

  function handleChange(value: string) {
    setQuery(value);
    // 뒤로가기가 글자마다 쌓이지 않게 replace
    router.replace(value ? `/?q=${encodeURIComponent(value)}` : "/");
  }

  return (
    <>
      <Header title="WhereHouse" />
      <div className="px-4 pt-4">
        <input
          type="search"
          aria-label="재고 검색"
          placeholder="이름·분류·메모 검색"
          className="min-h-11 w-full rounded-lg border border-zinc-300 px-3 text-base"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      {!loaded ? (
        <p className="p-4">불러오는 중…</p>
      ) : searching ? (
        results.length === 0 ? (
          <p className="p-4 text-zinc-600">
            &lsquo;{query.trim()}&rsquo;에 해당하는 재고가 없습니다.
          </p>
        ) : (
          <>
            <p className="px-4 pt-3 text-sm text-zinc-600">
              검색 결과 {results.length}개
            </p>
            <ul className="divide-y divide-zinc-200">
              {results.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  href={`/item/edit/?id=${item.id}&q=${encodeURIComponent(query)}`}
                  path={getLocationPath(locations, item.locationId)}
                  today={today}
                />
              ))}
            </ul>
          </>
        )
      ) : (
        <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/list/?loc=${room.id}`}
                className="flex aspect-square items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-lg font-semibold active:bg-zinc-100"
              >
                {room.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
