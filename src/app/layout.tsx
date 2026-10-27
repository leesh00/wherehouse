import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhereHouse",
  description: "집안 재고·위치·유통기한 관리",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="mx-auto min-h-full w-full max-w-[768px]">
        {children}
      </body>
    </html>
  );
}
