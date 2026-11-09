import Link from "next/link";

export default function Header({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex min-h-14 items-center gap-2 border-b border-zinc-200 px-2">
      {backHref && (
        <Link
          href={backHref}
          aria-label="뒤로"
          className="flex size-11 items-center justify-center text-xl"
        >
          ←
        </Link>
      )}
      <h1 className="flex-1 truncate px-2 text-lg font-bold">{title}</h1>
      {action}
    </header>
  );
}
