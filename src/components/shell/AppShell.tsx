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

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
              active
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-ink/75 hover:bg-overlay hover:text-ink",
            )}
          >
            {item.icon && <span className="shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px]">{item.icon}</span>}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brandMark = (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-display text-paper">
        {brand.charAt(0).toUpperCase()}
      </span>
      <div>
        <p className="font-display text-lg leading-tight text-ink">{brand}</p>
        <p className="text-xs text-muted">{subtitle}</p>
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
