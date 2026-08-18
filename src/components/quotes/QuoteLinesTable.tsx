import { formatEUR, lineTotalHT, quoteTotals } from "@/lib/quote-calc";
import type { QuoteLine } from "@/lib/types/database";

export function QuoteLinesTable({ lines }: { lines: QuoteLine[] }) {
  const totals = quoteTotals(lines);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Qté</th>
              <th className="px-3 py-2 font-medium">PU</th>
              <th className="px-3 py-2 font-medium">Remise</th>
              <th className="px-3 py-2 font-medium">TVA</th>
              <th className="px-3 py-2 text-right font-medium">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-ink">{line.description}</td>
                <td className="px-3 py-2 text-muted">{line.quantity}</td>
                <td className="px-3 py-2 text-muted">{formatEUR(line.unit_price)}</td>
                <td className="px-3 py-2 text-muted">{line.discount_percent}%</td>
                <td className="px-3 py-2 text-muted">{line.vat_rate}%</td>
                <td className="px-3 py-2 text-right text-ink">{formatEUR(lineTotalHT(line))}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
