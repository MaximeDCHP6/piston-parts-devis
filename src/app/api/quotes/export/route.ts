import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_LABEL } from "@/lib/status";
import { quoteTotals } from "@/lib/quote-calc";
import { toCsv, csvResponse } from "@/lib/csv";
import type { QuoteLine, QuoteStatus } from "@/lib/types/database";

function isQuoteStatus(value: string): value is QuoteStatus {
  return value in QUOTE_STATUS_LABEL;
}

// Reprend exactement les filtres de /admin/quotes pour exporter la liste
// telle qu'elle est affichée à l'écran.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const reseller = searchParams.get("reseller") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const supabase = await createClient();

  let query = supabase.from("quotes").select("*").eq("type", "to_client").order("created_at", { ascending: false });
  if (q) query = query.or(`client_name.ilike.%${q}%,order_number.ilike.%${q}%`);
  if (reseller) query = query.eq("reseller_id", reseller);
  if (status && isQuoteStatus(status)) query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const [{ data: quotes }, { data: resellers }] = await Promise.all([
    query,
    supabase.from("resellers").select("id, company_name"),
  ]);
  const resellerNameById = new Map((resellers ?? []).map((r) => [r.id, r.company_name]));

  const quoteIds = (quotes ?? []).map((quote) => quote.id);
  const { data: lines } =
    quoteIds.length > 0
      ? await supabase.from("quote_lines").select("*").in("quote_id", quoteIds)
      : { data: [] as QuoteLine[] };

  const linesByQuoteId = new Map<string, QuoteLine[]>();
  for (const line of lines ?? []) {
    const arr = linesByQuoteId.get(line.quote_id) ?? [];
    arr.push(line);
    linesByQuoteId.set(line.quote_id, arr);
  }

  const rows = (quotes ?? []).map((quote) => {
    const totals = quoteTotals(linesByQuoteId.get(quote.id) ?? []);
    return [
      new Date(quote.created_at).toLocaleDateString("fr-FR"),
      resellerNameById.get(quote.reseller_id) ?? "",
      quote.client_name ?? "",
      quote.order_number ?? "",
      quote.quote_number ?? "",
      QUOTE_STATUS_LABEL[quote.status as QuoteStatus],
      totals.totalHT.toFixed(2),
      totals.totalTTC.toFixed(2),
    ];
  });

  const csv = toCsv(
    ["Date", "Revendeur", "Client final", "N° commande", "N° devis", "Statut", "Total HT", "Total TTC"],
    rows,
  );

  return csvResponse(`devis-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
