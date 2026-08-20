"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

export function AppShell({
  brand,
  subtitle,
  navItems,
  footer,
  children,
}: {
  brand: string;
  subtitle: string;
  navItems: NavItem[];
  footer?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // "/admin" est un préfixe de toutes les autres routes admin (/admin/quotes,
  // etc.) : un simple `startsWith` marquerait le tableau de bord actif sur
  // TOUTES les pages en plus de la vraie page courante. On ne retient donc
  // que l'item dont le href est le plus long parmi ceux qui correspondent.
  const activeHref = navItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "relative flex items-center gap-2.5 rounded-sm border-l-2 px-3 py-2 text-sm font-medium transition-all",
              active
                ? "border-accent bg-accent/10 text-accent"
                : "border-transparent text-ink/70 hover:border-border hover:bg-overlay hover:text-ink",
            )}
            style={active ? { boxShadow: "inset 2px 0 6px -3px var(--accent)" } : undefined}
          >
            {item.icon && (
              <span className={cn("shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px]", active ? "text-accent" : "text-muted")}>
                {item.icon}
              </span>
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brandMark = (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-accent/30 bg-ink font-mono text-sm text-accent">
        {brand.charAt(0).toUpperCase()}
      </span>
      <div>
        <p className="font-display text-lg leading-tight text-ink">{brand}</p>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <header className="no-print flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:hidden">
        {brandMark}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ouvrir le menu"
          className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-ink/30"
        >
          {open ? "Fermer" : "Menu"}
        </button>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className={cn(
            "no-print w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 sm:flex sm:min-h-screen sm:sticky sm:top-0",
            open ? "flex fixed inset-0 z-40 min-h-screen" : "hidden",
          )}
        >
          <div className="mb-8 hidden sm:block">{brandMark}</div>
          {nav}
          {footer && <div className="mt-auto border-t border-border pt-4">{footer}</div>}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
