"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResultItem } from "@/lib/types/search";

export function GlobalSearch({ action }: { action: (query: string) => Promise<SearchResultItem[]> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      /* eslint-disable react-hooks/set-state-in-effect -- reinitialise la modale à sa fermeture, pas un dérivé de props/state */
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      action(q).then((items) => {
        if (!cancelled) {
          setResults(items);
          setActiveIndex(0);
          setLoading(false);
        }
      });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, action]);

  function select(item: SearchResultItem) {
    setOpen(false);
    router.push(item.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      select(results[activeIndex]);
    }
  }

  const groups = Array.from(new Set(results.map((r) => r.group)));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between gap-2 rounded-sm border border-border bg-paper px-3 py-2 text-sm text-muted transition-colors hover:border-ink/30"
      >
        <span>Rechercher…</span>
        <kbd className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[0.65rem] text-muted">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-md border border-border bg-surface shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Devis, revendeur, produit, client…"
              className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-muted"
            />
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-3 text-sm text-muted">Recherche…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">
                  {query.trim().length < 2 ? "Tapez au moins 2 caractères…" : "Aucun résultat."}
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group}>
                    <p className="px-4 pt-3 font-mono text-[0.65rem] uppercase tracking-wide text-muted">{group}</p>
                    <ul>
                      {results
                        .map((item, index) => ({ item, index }))
                        .filter(({ item }) => item.group === group)
                        .map(({ item, index }) => (
                          <li key={`${item.group}-${item.href}-${index}`}>
                            <button
                              type="button"
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => select(item)}
                              className={
                                index === activeIndex
                                  ? "block w-full px-4 py-2 text-left text-sm bg-overlay"
                                  : "block w-full px-4 py-2 text-left text-sm"
                              }
                            >
                              <span className="text-ink">{item.label}</span>
                              {item.sub && <span className="ml-2 text-xs text-muted">{item.sub}</span>}
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
