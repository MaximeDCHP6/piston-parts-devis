"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/Field";
import type { Product } from "@/lib/types/database";

function label(p: Product) {
  return p.sku ? `${p.sku} — ${p.name}` : p.name;
}

export function ProductCombobox({
  products,
  selectedProduct,
  onPick,
}: {
  products: Product[];
  selectedProduct: Product | null;
  onPick: (product: Product | null) => void;
}) {
  const [query, setQuery] = useState(selectedProduct ? label(selectedProduct) : "");
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pas d'effet de synchronisation nécessaire ici : `query` ne change que
  // via l'état initial (produit déjà sélectionné en mode édition) ou via
  // les gestionnaires ci-dessous (choix d'une suggestion, saisie) — jamais
  // suite à un changement externe de `selectedProduct`.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      // Ne jamais effacer ce qui a été tapé si rien n'a été sélectionné :
      // seule la liste de suggestions se ferme.
      setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function openDropdown() {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 240) });
    }
    setOpen(true);
  }

  const q = query.trim().toLowerCase();
  const matches = q
    ? products
        .filter((p) => p.sku?.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
        .slice(0, 8)
    : [];

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (selectedProduct) onPick(null);
          openDropdown();
        }}
        onFocus={openDropdown}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Référence ou nom…"
        className="min-w-[180px]"
      />
      {open &&
        rect &&
        createPortal(
          <ul
            style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, zIndex: 50 }}
            className="max-h-56 overflow-auto rounded-sm border border-border bg-surface shadow-lg"
          >
            {matches.length > 0 ? (
              matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // mousedown (pas click) pour devancer le blur/clic
                      // extérieur qui fermerait la liste avant la sélection.
                      e.preventDefault();
                      onPick(p);
                      setQuery(label(p));
                      setOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-overlay"
                  >
                    <span className="font-medium text-ink">{p.sku ?? "—"}</span>{" "}
                    <span className="text-muted">{p.name}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-muted">
                {q ? "Aucune référence ne correspond." : "Tapez une référence ou un nom de produit…"}
              </li>
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
