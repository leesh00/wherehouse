export const EXPIRY_SOON_DAYS = 7;

export type ExpiryLabel = {
  kind: "expired" | "today" | "soon" | "later";
  text: string;
};

const toUtcDay = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

/**
 * 유통기한 표시 문구. today는 로컬 기준 YYYY-MM-DD.
 * 지남 → "기한 지남 N일", 당일 → "오늘까지", 7일 이내 → "D-N", 그 이후 → "~MM/DD"
 */
export function getExpiryLabel(
  expiresAt: string | undefined,
  today: string,
): ExpiryLabel | null {
  if (!expiresAt) return null;
  const date = expiresAt.slice(0, 10);
  const days = toUtcDay(date) - toUtcDay(today);

  if (days < 0) return { kind: "expired", text: `기한 지남 ${-days}일` };
  if (days === 0) return { kind: "today", text: "오늘까지" };
  if (days <= EXPIRY_SOON_DAYS) return { kind: "soon", text: `D-${days}` };
  const [y, m, d] = date.split("-");
  const md = `${m}/${d}`;
  return {
    kind: "later",
    text: y === today.slice(0, 4) ? `~${md}` : `~${y}/${md}`,
  };
}
