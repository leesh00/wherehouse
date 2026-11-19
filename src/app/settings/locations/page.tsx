"use client";

import { useState } from "react";
import Header from "@/components/Header";
import {
  MAX_DEPTH,
  flattenTree,
  getDeleteBlockers,
  moveLocation as getMovedLocations,
} from "@/core/location";
import type { Location } from "@/core/types";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

const input =
  "min-h-11 w-full min-w-0 flex-1 rounded-lg border border-line-strong px-3 text-base";
const button =
  "min-h-11 shrink-0 rounded-lg border border-line-strong px-3 font-semibold disabled:opacity-40";
const iconButton =
  "size-11 shrink-0 rounded-lg border border-line-strong disabled:opacity-30";

/** 이름 입력 + 저장. 빈 이름은 저장하지 않는다 */
function NameForm({
  label,
  initial = "",
  autoFocus = false,
  submitLabel,
  onSubmit,
}: {
  label: string;
  initial?: string;
  autoFocus?: boolean;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState("");
  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setError("이름을 입력하세요.");
        try {
          await onSubmit(name);
          setName("");
          setError("");
        } catch (err) {
          setError(`저장하지 못했습니다. (${String(err)})`);
        }
      }}
    >
      <div className="flex gap-2">
        <input
          className={input}
          aria-label={label}
          placeholder={label}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={autoFocus}
        />
        <button type="submit" className={button}>
          {submitLabel}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          ⚠ {error}
        </p>
      )}
    </form>
  );
}

function Editor({ loc, onDone }: { loc: Location; onDone: () => void }) {
  const locations = useInventory((s) => s.locations);
  const items = useInventory((s) => s.items);
  const renameLocation = useInventory((s) => s.renameLocation);
  const addLocation = useInventory((s) => s.addLocation);
  const deleteLocation = useInventory((s) => s.deleteLocation);
  const blockers = getDeleteBlockers(locations, items, loc.id);
  const reason = [
    blockers.children && `하위 위치 ${blockers.children}개`,
    blockers.items && `재고 ${blockers.items}개`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-3 border-l-4 border-line-strong bg-surface p-3">
      <NameForm
        label="위치 이름"
        initial={loc.name}
        autoFocus
        submitLabel="저장"
        onSubmit={async (name) => {
          await renameLocation(loc.id, name);
          onDone();
        }}
      />
      {loc.depth < MAX_DEPTH && (
        <NameForm
          label={`'${loc.name}' 안에 추가할 위치 이름`}
          submitLabel="+ 하위 추가"
          onSubmit={(name) => addLocation(name, loc.id)}
        />
      )}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={!!reason}
          aria-describedby={reason ? `blocked-${loc.id}` : undefined}
          className={`${button} border-danger text-danger`}
          onClick={async () => {
            if (
              !confirm(`'${loc.name}' 위치를 삭제할까요? 되돌릴 수 없습니다.`)
            )
              return;
            try {
              await deleteLocation(loc.id);
              onDone();
            } catch (err) {
              alert(`삭제하지 못했습니다. (${String(err)})`);
            }
          }}
        >
          삭제
        </button>
        {reason && (
          <p id={`blocked-${loc.id}`} className="text-sm text-muted">
            {reason}가 있어 삭제할 수 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const loaded = useLoadInventory();
  const locations = useInventory((s) => s.locations);
  const moveLocation = useInventory((s) => s.moveLocation);
  const addLocation = useInventory((s) => s.addLocation);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 같은 부모 안에서 맨 앞/맨 뒤면 움직일 수 없다
  const isEdge = (loc: Location, dir: -1 | 1) =>
    getMovedLocations(locations, loc.id, dir).length === 0;

  return (
    <>
      <Header title="위치 관리" backHref="/settings/" />
      {!loaded ? (
        <p className="p-4">불러오는 중…</p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {flattenTree(locations).map((loc) => (
              <li key={loc.id}>
                <div
                  className="flex min-h-14 items-center gap-1 py-1 pr-2"
                  style={{ paddingLeft: `${16 + loc.depth * 20}px` }}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {loc.depth > 0 && (
                      <span aria-hidden className="text-muted">
                        └{" "}
                      </span>
                    )}
                    {loc.name}
                  </span>
                  <button
                    type="button"
                    aria-label={`${loc.name} 위로`}
                    className={iconButton}
                    disabled={isEdge(loc, -1)}
                    onClick={() => moveLocation(loc.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`${loc.name} 아래로`}
                    className={iconButton}
                    disabled={isEdge(loc, 1)}
                    onClick={() => moveLocation(loc.id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-expanded={editingId === loc.id}
                    className={button}
                    onClick={() =>
                      setEditingId(editingId === loc.id ? null : loc.id)
                    }
                  >
                    {editingId === loc.id ? "닫기" : "편집"}
                  </button>
                </div>
                {editingId === loc.id && (
                  <Editor
                    key={loc.id}
                    loc={loc}
                    onDone={() => setEditingId(null)}
                  />
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-4">
            <NameForm
              label="새 방 이름"
              submitLabel="+ 방 추가"
              onSubmit={(name) => addLocation(name, null)}
            />
          </div>
        </>
      )}
    </>
  );
}
