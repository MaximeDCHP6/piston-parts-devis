"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/Field";
import { searchProducts } from "./actions";
import type { Product } from "@/lib/types/database";

function label(p: Product) {
  return p.sku ? `${p.sku} — ${p.name}` : p.name;
}

export function ProductCombobox({
  selectedProduct,
  onPick,
}: {
  selectedProduct: Product | null;
  onPick: (product: Product | null) => void;
}) {
  const [query, setQuery] = useState(selectedProduct ? label(selectedProduct) : "");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recherche côté serveur (catalogue de plusieurs milliers de références,
  // impossible à charger entièrement côté client). Débounce simple : une
  // requête 250ms après la dernière frappe, la précédente est abandonnée.
  // setState synchrone justifié : on synchronise avec une recherche serveur
  // externe (indicateur de chargement + résultats), pas un dérivé de props/state.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setMatches([]);
      setLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      searchProducts(q).then((results) => {
        if (!cancelled) {
          setMatches(results);
          setLoading(false);
        }
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

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
            {loading ? (
              <li className="px-3 py-2 text-sm text-muted">Recherche…</li>
            ) : matches.length > 0 ? (
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
                {query.trim().length < 2 ? "Tapez au moins 2 caractères…" : "Aucune référence ne correspond."}
              </li>
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
