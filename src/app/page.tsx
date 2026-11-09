"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

export default function Home() {
  const loaded = useLoadInventory();
  const rooms = useInventory((s) => s.locations)
    .filter((l) => l.parentId === null)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <Header title="WhereHouse" />
      {loaded ? (
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
      ) : (
        <p className="p-4">불러오는 중…</p>
      )}
    </>
  );
}
