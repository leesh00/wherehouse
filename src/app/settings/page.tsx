import Link from "next/link";
import Header from "@/components/Header";

export default function Settings() {
  return (
    <>
      <Header title="설정" backHref="/" />
      <ul className="divide-y divide-zinc-200">
        <li>
          <Link
            href="/settings/locations/"
            className="flex min-h-14 items-center justify-between px-4"
          >
            위치 관리
            <span aria-hidden>›</span>
          </Link>
        </li>
      </ul>
    </>
  );
}
