export interface LineCalcInput {
  quantity: number;
  unit_price: number;
  discount_percent: number;
  vat_rate: number;
}

export function lineTotalHT(line: LineCalcInput): number {
  return line.quantity * line.unit_price * (1 - line.discount_percent / 100);
}

export function lineTotalTTC(line: LineCalcInput): number {
  return lineTotalHT(line) * (1 + line.vat_rate / 100);
}

export function quoteTotals(lines: LineCalcInput[]): { totalHT: number; totalTTC: number } {
  return lines.reduce(
    (acc, line) => ({
      totalHT: acc.totalHT + lineTotalHT(line),
      totalTTC: acc.totalTTC + lineTotalTTC(line),
    }),
    { totalHT: 0, totalTTC: 0 },
  );
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

export function applyMargin(unitPrice: number, marginPercent: number): number {
  return Math.round(unitPrice * (1 + marginPercent / 100) * 100) / 100;
}
