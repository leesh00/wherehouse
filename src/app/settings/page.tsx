"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import Header from "@/components/Header";
import { backupFileName, buildBackup, parseBackup } from "@/core/backup";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const row = "flex min-h-14 w-full items-center justify-between px-4 text-left";

export default function Settings() {
  const loaded = useLoadInventory();
  const locations = useInventory((s) => s.locations);
  const items = useInventory((s) => s.items);
  const importData = useInventory((s) => s.importData);
  const theme = useInventory((s) => s.theme);
  const setTheme = useInventory((s) => s.setTheme);
  const systemDark = useSyncExternalStore(
    (onChange) => {
      const m = matchMedia(DARK_QUERY);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => matchMedia(DARK_QUERY).matches,
    () => false, // 빌드(프리렌더) 시
  );
  // 고른 적 없으면 지금 시스템 설정 기준
  const isDark = (theme ?? (systemDark ? "dark" : "light")) === "dark";
  const [message, setMessage] = useState("");

  function handleExport() {
    const blob = new Blob(
      [JSON.stringify(buildBackup(locations, items), null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName();
    a.click();
    URL.revokeObjectURL(url);
    setMessage(
      `재고 ${items.length}개, 위치 ${locations.length}개를 내보냈습니다.`,
    );
  }

  async function handleImport(file: File) {
    setMessage("");
    let parsed;
    try {
      parsed = parseBackup(await file.text());
    } catch (err) {
      alert(`가져올 수 없습니다. ${(err as Error).message}`);
      return;
    }
    const { total } = parsed;
    if (parsed.locations.length === 0) {
      alert("가져올 수 없습니다. 올바른 위치가 하나도 없습니다.");
      return;
    }
    // 1) 일부만 올바르면: 올바른 것만 가져올지(확인) 전체 거부할지(취소)
    const partial =
      parsed.locations.length < total.locations ||
      parsed.items.length < total.items;
    if (
      partial &&
      !confirm(
        `파일의 일부만 가져올 수 있습니다.\n` +
          `재고 ${total.items}개 중 ${parsed.items.length}개, 위치 ${total.locations}개 중 ${parsed.locations.length}개가 올바릅니다.\n\n` +
          `확인: 올바른 것만 가져오기\n취소: 가져오지 않기`,
      )
    )
      return setMessage("가져오기를 취소했습니다.");
    // 2) 덮어쓰기 확인
    if (
      !confirm(
        `현재 재고 ${items.length}개, 위치 ${locations.length}개를 지우고 ` +
          `파일의 재고 ${parsed.items.length}개, 위치 ${parsed.locations.length}개로 바꿉니다.\n` +
          `되돌릴 수 없습니다. 필요하면 먼저 내보내기를 하세요.`,
      )
    )
      return setMessage("가져오기를 취소했습니다.");
    try {
      await importData(parsed.locations, parsed.items);
      setMessage(
        `재고 ${parsed.items.length}개, 위치 ${parsed.locations.length}개를 가져왔습니다.`,
      );
    } catch (err) {
      alert(
        `가져오지 못했습니다. 기존 데이터는 그대로입니다. (${String(err)})`,
      );
    }
  }

  return (
    <>
      <Header title="설정" backHref="/" />
      <ul className="divide-y divide-line">
        <li>
          <Link href="/settings/locations/" className={row}>
            위치 관리
            <span aria-hidden>›</span>
          </Link>
        </li>
        <li>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            disabled={!loaded}
            className={row}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            <span>
              다크모드
              {theme === null && (
                <span className="block text-sm text-muted">
                  시스템 설정을 따르는 중
                </span>
              )}
            </span>
            {/* 색만으로 구분하지 않도록 켜짐/꺼짐 글자도 표시 */}
            <span className="flex items-center gap-2 text-sm">
              {isDark ? "켜짐" : "꺼짐"}
              <span
                aria-hidden
                className={`flex h-7 w-12 items-center rounded-full border-2 p-0.5 ${
                  isDark
                    ? "justify-end border-primary bg-primary"
                    : "justify-start border-line-strong bg-surface"
                }`}
              >
                <span
                  className={`size-5 rounded-full ${isDark ? "bg-on-primary" : "bg-muted"}`}
                />
              </span>
            </span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={row}
            disabled={!loaded}
            onClick={handleExport}
          >
            데이터 내보내기 (JSON)
          </button>
        </li>
        <li>
          {/* 파일 선택창은 label로 연다 */}
          <label className={`${row} cursor-pointer`}>
            데이터 가져오기 (JSON, 덮어쓰기)
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              disabled={!loaded}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ""; // 같은 파일을 다시 골라도 동작하게
                if (file) handleImport(file);
              }}
            />
          </label>
        </li>
      </ul>
      {message && (
        <p role="status" className="p-4 text-muted">
          {message}
        </p>
      )}
    </>
  );
}
