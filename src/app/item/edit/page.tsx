"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Header from "@/components/Header";
import ItemForm from "@/components/ItemForm";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

function EditItem() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  // 검색 결과에서 왔으면(&q=) 저장·삭제·뒤로 모두 검색 결과로 돌아간다
  const q = params.get("q");
  const searchHref = q ? `/?q=${encodeURIComponent(q)}` : null;
  const loaded = useLoadInventory();
  const locations = useInventory((s) => s.locations);
  const item = useInventory((s) => s.items.find((i) => i.id === id));
  const updateItem = useInventory((s) => s.updateItem);
  const deleteItem = useInventory((s) => s.deleteItem);
  // 삭제 후 이동 전까지 "찾을 수 없음"이 잠깐 보이지 않게
  const [deletedTo, setDeletedTo] = useState<string | null>(null);
  const backHref = searchHref ?? (item ? `/list/?loc=${item.locationId}` : "/");

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`'${item.name}'을(를) 삭제할까요? 되돌릴 수 없습니다.`))
      return;
    const to = searchHref ?? `/list/?loc=${item.locationId}`;
    try {
      setDeletedTo(to);
      await deleteItem(item.id);
      router.replace(to);
    } catch (err) {
      setDeletedTo(null);
      alert(`삭제하지 못했습니다. 다시 시도해 주세요. (${String(err)})`);
    }
  }

  return (
    <>
      <Header title="재고 수정" backHref={deletedTo ?? backHref} />
      {deletedTo ? (
        <p className="p-4">삭제 중…</p>
      ) : !loaded ? (
        <p className="p-4">불러오는 중…</p>
      ) : !item ? (
        <p className="p-4">재고를 찾을 수 없습니다.</p>
      ) : (
        <>
          <ItemForm
            key={item.id}
            locations={locations}
            initial={item}
            submitLabel="저장"
            onSubmit={async (input) => {
              const saved = await updateItem(item.id, input);
              router.replace(searchHref ?? `/list/?loc=${saved.locationId}`);
            }}
          />
          <div className="px-4 pb-8">
            <button
              type="button"
              onClick={handleDelete}
              className="min-h-11 w-full rounded-lg border border-red-700 font-semibold text-red-700"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <EditItem />
    </Suspense>
  );
}
