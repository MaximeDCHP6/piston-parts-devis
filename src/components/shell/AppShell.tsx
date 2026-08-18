"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
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
              "rounded-sm px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-ink text-paper"
                : "text-ink/80 hover:bg-black/5",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper">
      <header className="no-print flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:hidden">
        <div>
          <p className="font-display text-lg text-ink">{brand}</p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ouvrir le menu"
          className="rounded-sm border border-border px-3 py-2 text-sm"
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
          <div className="mb-8 hidden sm:block">
            <p className="font-display text-lg text-ink">{brand}</p>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
          {nav}
          {footer && <div className="mt-auto pt-6">{footer}</div>}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
