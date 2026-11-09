"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import ItemForm from "@/components/ItemForm";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

function NewItem() {
  const router = useRouter();
  const loc = useSearchParams().get("loc") ?? "";
  const loaded = useLoadInventory();
  const locations = useInventory((s) => s.locations);
  const addItem = useInventory((s) => s.addItem);
  const backHref = loc ? `/list/?loc=${loc}` : "/";

  return (
    <>
      <Header title="재고 등록" backHref={backHref} />
      {loaded ? (
        <ItemForm
          locations={locations}
          initial={{
            name: "",
            category: "",
            locationId: loc || locations[0]?.id || "",
            quantity: 1,
            unit: "",
            purchasedAt: new Date().toLocaleDateString("sv-SE"), // 로컬 기준 오늘 YYYY-MM-DD
            memo: "",
          }}
          submitLabel="등록"
          onSubmit={async (input) => {
            const saved = await addItem(input);
            router.replace(`/list/?loc=${saved.locationId}`);
          }}
        />
      ) : (
        <p className="p-4">불러오는 중…</p>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <NewItem />
    </Suspense>
  );
}
