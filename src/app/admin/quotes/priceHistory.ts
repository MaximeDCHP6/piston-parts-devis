import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { priceHistoryKey } from "@/lib/quote-calc";
import type { PriceHistoryEntry } from "./QuoteLinesEditor";

// Dernier prix (coût + prix client) pratiqué pour un couple revendeur/produit,
// pour proposer automatiquement un tarif spécifique déjà négocié plutôt que
// de retomber systématiquement sur le prix de base du catalogue.
export async function buildPriceHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Record<string, PriceHistoryEntry>> {
  const [{ data: quotes }, { data: lines }, { data: costs }] = await Promise.all([
    supabase.from("quotes").select("id, reseller_id, created_at"),
    supabase.from("quote_lines").select("id, quote_id, product_id, unit_price").not("product_id", "is", null),
    supabase.from("quote_line_costs").select("*"),
  ]);

  const quoteById = new Map((quotes ?? []).map((q) => [q.id, q]));
  const costByLineId = new Map((costs ?? []).map((c) => [c.quote_line_id, c.cost_price]));

  const latestByKey = new Map<string, { createdAt: string; entry: PriceHistoryEntry }>();

  for (const line of lines ?? []) {
    if (!line.product_id) continue;
    const quote = quoteById.get(line.quote_id);
    if (!quote) continue;

    const key = priceHistoryKey(quote.reseller_id, line.product_id);
    const existing = latestByKey.get(key);
    if (!existing || quote.created_at > existing.createdAt) {
      latestByKey.set(key, {
        createdAt: quote.created_at,
        entry: { unit_price: line.unit_price, cost_price: costByLineId.get(line.id) ?? 0 },
      });
    }
  }

  return Object.fromEntries(Array.from(latestByKey.entries(), ([key, v]) => [key, v.entry]));
}
