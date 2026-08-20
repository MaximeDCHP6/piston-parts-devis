import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import { QUOTE_STATUS_LABEL } from "@/lib/status";
import { quoteTotals } from "@/lib/quote-calc";
import { toCsv, csvResponse } from "@/lib/csv";
import type { QuoteLine, QuoteStatus } from "@/lib/types/database";

function isQuoteStatus(value: string): value is QuoteStatus {
  return value in QUOTE_STATUS_LABEL;
}

// Reprend les filtres de /espace/devis. RLS limite de toute façon le
// résultat aux devis du revendeur connecté.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const client = searchParams.get("client") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const resellerId = await getCurrentResellerId();
  const supabase = await createClient();

  let query = supabase
    .from("quotes")
    .select("*")
    .eq("reseller_id", resellerId ?? "")
    .order("created_at", { ascending: false });
  if (q) query = query.or(`client_name.ilike.%${q}%,order_number.ilike.%${q}%`);
  if (status && isQuoteStatus(status)) query = query.eq("status", status);
  if (client) query = query.eq("client_name", client);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const { data: quotes } = await query;
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

  const lineIds = (lines ?? []).map((l) => l.id);
  const { data: costs } =
    lineIds.length > 0
      ? await supabase.from("quote_line_costs").select("*").in("quote_line_id", lineIds)
      : { data: [] as { quote_line_id: string; cost_price: number }[] };
  const costByLineId = new Map((costs ?? []).map((c) => [c.quote_line_id, c.cost_price]));

  const rows = (quotes ?? []).map((quote) => {
    const quoteLines = linesByQuoteId.get(quote.id) ?? [];
    const totals = quoteTotals(quoteLines);
    const yourTotal = quoteLines.reduce((sum, line) => sum + line.quantity * (costByLineId.get(line.id) ?? 0), 0);
    return [
      new Date(quote.created_at).toLocaleDateString("fr-FR"),
      quote.client_name ?? "",
      quote.order_number ?? "",
      QUOTE_STATUS_LABEL[quote.status as QuoteStatus],
      yourTotal.toFixed(2),
      totals.totalHT.toFixed(2),
      totals.totalTTC.toFixed(2),
    ];
  });

  const csv = toCsv(
    ["Date", "Client", "N° commande", "Statut", "Votre prix (HT)", "Total HT client", "Total TTC client"],
    rows,
  );

  return csvResponse(`mes-devis-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
