"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import ItemForm from "@/components/ItemForm";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

function EditItem() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const loaded = useLoadInventory();
  const locations = useInventory((s) => s.locations);
  const item = useInventory((s) => s.items.find((i) => i.id === id));
  const updateItem = useInventory((s) => s.updateItem);
  const backHref = item ? `/list/?loc=${item.locationId}` : "/";

  return (
    <>
      <Header title="재고 수정" backHref={backHref} />
      {!loaded ? (
        <p className="p-4">불러오는 중…</p>
      ) : !item ? (
        <p className="p-4">재고를 찾을 수 없습니다.</p>
      ) : (
        <ItemForm
          key={item.id}
          locations={locations}
          initial={item}
          submitLabel="저장"
          onSubmit={async (input) => {
            const saved = await updateItem(item.id, input);
            router.replace(`/list/?loc=${saved.locationId}`);
          }}
        />
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
