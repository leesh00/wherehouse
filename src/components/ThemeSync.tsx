"use client";

import { useEffect } from "react";
import { useInventory, useLoadInventory } from "@/hooks/useInventory";

/** 저장된 화면 모드를 <html data-theme>에 반영. 없으면 속성을 지워 시스템 설정을 따른다 */
export default function ThemeSync() {
  useLoadInventory();
  const theme = useInventory((s) => s.theme);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);
  return null;
}
