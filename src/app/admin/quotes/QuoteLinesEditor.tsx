"use client";

import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatEUR, quoteTotals } from "@/lib/quote-calc";
import type { Product } from "@/lib/types/database";

export interface EditableLine {
  key: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  vat_rate: number;
}

function emptyLine(): EditableLine {
  return {
    key: crypto.randomUUID(),
    product_id: null,
    description: "",
    quantity: 1,
    unit_price: 0,
    discount_percent: 0,
    vat_rate: 20,
  };
}

export function QuoteLinesEditor({ products }: { products: Product[] }) {
  const [lines, setLines] = useState<EditableLine[]>([emptyLine()]);

  const totals = useMemo(() => quoteTotals(lines), [lines]);

  function updateLine(key: string, patch: Partial<EditableLine>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.key !== key) : prev));
  }

  function onProductPick(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateLine(key, {
      product_id: product?.id ?? null,
      description: product ? product.name : "",
      unit_price: product?.purchase_price ?? 0,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Produit</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="w-20 px-3 py-2 font-medium">Qté</th>
              <th className="w-28 px-3 py-2 font-medium">PU (€)</th>
              <th className="w-20 px-3 py-2 font-medium">Remise %</th>
              <th className="w-20 px-3 py-2 font-medium">TVA %</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className="border-b border-border last:border-0 align-top">
                <td className="px-3 py-2">
                  <Select
                    value={line.product_id ?? ""}
                    onChange={(e) => onProductPick(line.key, e.target.value)}
                    className="min-w-[160px]"
                  >
                    <option value="">Ligne libre</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </Select>
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

      <Button type="button" variant="secondary" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])} className="self-start">
        + Ajouter une ligne
      </Button>

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
