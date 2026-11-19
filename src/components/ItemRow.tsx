import Link from "next/link";
import { getExpiryLabel, type ExpiryLabel } from "@/core/expiry";
import type { Item } from "@/core/types";

// 색과 함께 문구로도 상태를 구분한다
const badgeStyle: Record<ExpiryLabel["kind"], string> = {
  expired: "rounded bg-danger-soft px-1.5 font-semibold text-danger-strong",
  today: "rounded bg-warn-soft px-1.5 font-semibold text-warn",
  soon: "rounded bg-warn-soft px-1.5 font-semibold text-warn",
  later: "text-muted",
};

/** 재고 한 줄: 이름·유통기한 표시 / 위치 경로·분류 / 수량 */
export default function ItemRow({
  item,
  href,
  path,
  today,
}: {
  item: Item;
  href: string;
  path?: string; // 보여줄 위치 경로 (없으면 생략)
  today: string; // 로컬 YYYY-MM-DD
}) {
  const label = getExpiryLabel(item.expiresAt, today);
  return (
    <li>
      <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="truncate font-medium">{item.name}</span>
            {label && (
              <span className={`shrink-0 text-xs ${badgeStyle[label.kind]}`}>
                {label.text}
              </span>
            )}
          </p>
          <p className="truncate text-sm text-muted">
            {[path, item.category].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="shrink-0 font-semibold">
          {item.quantity}
          {item.unit}
        </span>
      </Link>
    </li>
  );
}
