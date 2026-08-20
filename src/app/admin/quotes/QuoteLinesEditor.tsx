"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ProductCombobox } from "./ProductCombobox";
import { applyMargin, formatEUR, priceHistoryKey, quoteTotals } from "@/lib/quote-calc";
import { QUOTE_DRAFT_LINES_KEY } from "./draftStorage";
import type { Product } from "@/lib/types/database";

export interface EditableLine {
  key: string;
  product_id: string | null;
  description: string;
  quantity: number;
  cost_price: number;
  unit_price: number;
  discount_percent: number;
  vat_rate: number;
  // Frais de port/emballage/divers : prix fixé directement par l'admin,
  // jamais recalculé automatiquement via la marge du revendeur.
  noMargin?: boolean;
}

export interface PriceHistoryEntry {
  unit_price: number;
  cost_price: number;
}

const QUICK_FEES = [
  { label: "+ Frais de port", description: "Frais de port" },
  { label: "+ Frais d'emballage", description: "Frais d'emballage" },
  { label: "+ Frais divers", description: "Frais divers" },
];

function emptyLine(): EditableLine {
  return {
    key: crypto.randomUUID(),
    product_id: null,
    description: "",
    quantity: 1,
    cost_price: 0,
    unit_price: 0,
    discount_percent: 0,
    vat_rate: 20,
  };
}

export function QuoteLinesEditor({
  initialProducts = [],
  marginPercent,
  resellerId,
  priceHistory = {},
  initialLines,
  allowDraftRestore = false,
}: {
  // Uniquement les produits déjà sélectionnés sur les lignes existantes
  // (mode édition), pour afficher leur référence/nom au chargement — la
  // recherche elle-même se fait côté serveur (voir ProductCombobox), le
  // catalogue complet n'est jamais chargé côté client.
  initialProducts?: Product[];
  marginPercent: number;
  resellerId: string;
  priceHistory?: Record<string, PriceHistoryEntry>;
  initialLines?: EditableLine[];
  allowDraftRestore?: boolean;
}) {
  const [lines, setLines] = useState<EditableLine[]>(initialLines?.length ? initialLines : [emptyLine()]);
  const [restoredDraft, setRestoredDraft] = useState(false);

  // Récupère un brouillon de lignes laissé par une session précédente
  // (navigation quittée sans enregistrer) — uniquement à la création d'un
  // nouveau devis, jamais en édition d'un devis existant.
  useEffect(() => {
    if (!allowDraftRestore) return;
    try {
      const raw = localStorage.getItem(QUOTE_DRAFT_LINES_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as EditableLine[];
        if (Array.isArray(draft) && draft.length > 0 && draft.some((l) => l.description || l.product_id)) {
          /* eslint-disable-next-line react-hooks/set-state-in-effect -- restauration
             ponctuelle d'un brouillon localStorage au montage */
          setLines(draft);
          setRestoredDraft(true);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!allowDraftRestore) return;
    try {
      localStorage.setItem(QUOTE_DRAFT_LINES_KEY, JSON.stringify(lines));
    } catch {
      // ignore (quota, navigateur privé…)
    }
  }, [allowDraftRestore, lines]);

  const totals = useMemo(() => quoteTotals(lines), [lines]);
  const productById = useMemo(() => new Map(initialProducts.map((p) => [p.id, p])), [initialProducts]);

  function updateLine(key: string, patch: Partial<EditableLine>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.key !== key) : prev));
  }

  function onProductPick(key: string, product: Product | null) {
    if (!product) {
      updateLine(key, { product_id: null });
      return;
    }

    const previous = resellerId ? priceHistory[priceHistoryKey(resellerId, product.id)] : undefined;
    const cost = previous?.cost_price ?? product.purchase_price ?? 0;
    const unitPrice = previous?.unit_price ?? applyMargin(cost, marginPercent);

    updateLine(key, {
      product_id: product.id,
      description: product.name,
      cost_price: cost,
      unit_price: unitPrice,
    });
  }

  function onCostChange(key: string, cost: number) {
    setLines((prev) =>
      prev.map((line) =>
        line.key === key
          ? { ...line, cost_price: cost, unit_price: line.noMargin ? cost : applyMargin(cost, marginPercent) }
          : line,
      ),
    );
  }

  function addQuickFee(description: string) {
    setLines((prev) => [...prev, { ...emptyLine(), description, noMargin: true }]);
  }

  function clearDraft() {
    try {
      localStorage.removeItem(QUOTE_DRAFT_LINES_KEY);
    } catch {
      // ignore
    }
    setLines([emptyLine()]);
    setRestoredDraft(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      {restoredDraft && (
        <p className="rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Brouillon de lignes restauré depuis votre dernière saisie.{" "}
          <button type="button" onClick={clearDraft} className="underline">
            Repartir de zéro
          </button>
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Référence / produit</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="w-20 px-3 py-2 font-medium">Qté</th>
              <th className="w-28 px-3 py-2 font-medium">Coût (€)</th>
              <th className="w-28 px-3 py-2 font-medium">PU client (€)</th>
              <th className="w-20 px-3 py-2 font-medium">Remise %</th>
              <th className="w-20 px-3 py-2 font-medium">TVA %</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className="border-b border-border last:border-0 align-top">
                <td className="px-3 py-2">
                  <ProductCombobox
                    selectedProduct={line.product_id ? productById.get(line.product_id) ?? null : null}
                    onPick={(product) => onProductPick(line.key, product)}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                    className="min-w-[200px]"
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.cost_price}
                    onChange={(e) => onCostChange(line.key, Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) => updateLine(line.key, { unit_price: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={line.discount_percent}
                    onChange={(e) => updateLine(line.key, { discount_percent: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.vat_rate}
                    onChange={(e) => updateLine(line.key, { vat_rate: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="text-muted hover:text-danger"
                    aria-label="Supprimer la ligne"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
          + Ajouter une ligne
        </Button>
        {QUICK_FEES.map((fee) => (
          <Button key={fee.description} type="button" variant="ghost" size="sm" onClick={() => addQuickFee(fee.description)}>
            {fee.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col items-end gap-1 text-sm">
        <p className="text-muted">
          Total HT : <span className="font-medium text-ink">{formatEUR(totals.totalHT)}</span>
        </p>
        <p className="text-muted">
          Total TTC : <span className="font-medium text-ink">{formatEUR(totals.totalTTC)}</span>
        </p>
      </div>
    </div>
  );
}
