import { describe, expect, it } from "vitest";
import { getExpiryLabel } from "./expiry";

const today = "2026-11-10";
const label = (date?: string) =>
  getExpiryLabel(date && `${date}T00:00:00.000Z`, today);

describe("getExpiryLabel", () => {
  it("유통기한이 없으면 null", () => {
    expect(label(undefined)).toBeNull();
  });

  it("지난 날짜는 며칠 지났는지 표시", () => {
    expect(label("2026-11-08")).toEqual({
      kind: "expired",
      text: "기한 지남 2일",
    });
  });

  it("오늘이면 '오늘까지'", () => {
    expect(label("2026-11-10")).toEqual({ kind: "today", text: "오늘까지" });
  });

  it("D-1 ~ D-7은 임박", () => {
    expect(label("2026-11-11")).toEqual({ kind: "soon", text: "D-1" });
    expect(label("2026-11-17")).toEqual({ kind: "soon", text: "D-7" });
  });

  it("8일 이상 남으면 날짜 표시 (다른 해면 연도 포함)", () => {
    expect(label("2026-11-18")).toEqual({ kind: "later", text: "~11/18" });
    expect(label("2027-01-05")).toEqual({
      kind: "later",
      text: "~2027/01/05",
    });
  });

  it("월말·연말을 넘어도 일수를 정확히 센다", () => {
    expect(getExpiryLabel("2027-01-02T00:00:00.000Z", "2026-12-30")).toEqual({
      kind: "soon",
      text: "D-3",
    });
  });
});
