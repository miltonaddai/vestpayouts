import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbLd } from "@/lib/seo";
import { JsonLd } from "./json-ld";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbLd(all)} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((it, i) => (
            <li key={it.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 opacity-50" aria-hidden="true" />}
              {i === all.length - 1 ? (
                <span aria-current="page" className="max-w-[16rem] truncate text-paper/80">
                  {it.name}
                </span>
              ) : (
                <Link href={it.path} className="hover:text-paper">
                  {it.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
