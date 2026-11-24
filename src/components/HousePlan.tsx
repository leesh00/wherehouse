import Link from "next/link";
import type { Location, Placement } from "@/core/types";

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/**
 * 집 전개도 (임시 도형). 누르는 단위는 방이다 — 가구를 눌러도 그 방으로 들어간다 (007).
 * 배치된 방들을 감싸는 영역만 화면 폭에 맞춰 그린다.
 */
export default function HousePlan({
  locations,
  layout,
}: {
  locations: Location[];
  layout: Placement[];
}) {
  const byId = new Map(locations.map((l) => [l.id, l]));
  // 화면 낭독기가 위치 관리 순서대로 읽게 order로 정렬
  const rooms = layout
    .filter((p) => byId.get(p.locationId)?.depth === 0)
    .sort(
      (a, b) => byId.get(a.locationId)!.order - byId.get(b.locationId)!.order,
    );
  if (rooms.length === 0)
    return (
      <p className="p-4 text-muted">
        방이 없습니다. 설정 › 위치 관리에서 방을 추가하세요.
      </p>
    );

  const minX = Math.min(...rooms.map((r) => r.x));
  const minY = Math.min(...rooms.map((r) => r.y));
  const w = Math.max(...rooms.map((r) => r.x + r.w)) - minX;
  const h = Math.max(...rooms.map((r) => r.y + r.h)) - minY;

  return (
    <div className="p-4">
      <ul className="relative w-full" style={{ aspectRatio: `${w} / ${h}` }}>
        {rooms.map((room) => {
          const name = byId.get(room.locationId)!.name;
          const furniture = layout.filter(
            (p) => byId.get(p.locationId)?.parentId === room.locationId,
          );
          return (
            <li
              key={room.locationId}
              className="absolute"
              style={{
                left: pct(room.x - minX, w),
                top: pct(room.y - minY, h),
                width: pct(room.w, w),
                height: pct(room.h, h),
              }}
            >
              <Link
                href={`/room/?loc=${room.locationId}`}
                className="relative block size-full overflow-hidden border-2 border-line-strong bg-surface active:bg-surface-active"
              >
                {furniture.map((f) => (
                  <span
                    key={f.locationId}
                    aria-hidden
                    className="absolute rounded-sm border border-line-strong bg-surface-active"
                    style={{
                      left: pct(f.x, room.w),
                      top: pct(f.y, room.h),
                      width: pct(f.w, room.w),
                      height: pct(f.h, room.h),
                    }}
                  />
                ))}
                <span className="absolute inset-0 flex items-center justify-center p-1 text-center font-semibold break-keep">
                  {name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
