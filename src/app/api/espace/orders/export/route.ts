import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import { ORDER_STATUS_LABEL } from "@/lib/status";
import { toCsv, csvResponse } from "@/lib/csv";
import type { Order, OrderStatus } from "@/lib/types/database";

function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_LABEL;
}

// Reprend les filtres de /espace/commandes. RLS limite de toute façon le
// résultat aux commandes du revendeur connecté.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const client = searchParams.get("client") ?? undefined;

  const resellerId = await getCurrentResellerId();
  const supabase = await createClient();

  let matchingQuoteIds: string[] | null = null;
  if (client) {
    const { data } = await supabase.from("quotes").select("id").eq("reseller_id", resellerId ?? "").eq("client_name", client);
    matchingQuoteIds = (data ?? []).map((r) => r.id);
  } else if (q) {
    const { data } = await supabase.from("quotes").select("id").eq("reseller_id", resellerId ?? "").ilike("client_name", `%${q}%`);
    matchingQuoteIds = (data ?? []).map((r) => r.id);
  }

  let orders: Order[] = [];
  if (!matchingQuoteIds || matchingQuoteIds.length > 0) {
    let query = supabase.from("orders").select("*").eq("reseller_id", resellerId ?? "").order("created_at", { ascending: false });
    if (matchingQuoteIds) query = query.in("quote_id", matchingQuoteIds);
    if (status && isOrderStatus(status)) query = query.eq("status", status);
    const { data } = await query;
    orders = data ?? [];
  }

  const quoteIds = orders.map((o) => o.quote_id);
  const { data: quotes } =
    quoteIds.length > 0
      ? await supabase.from("quotes").select("id, client_name, order_number").in("id", quoteIds)
      : { data: [] as { id: string; client_name: string | null; order_number: string | null }[] };
  const quoteById = new Map((quotes ?? []).map((quote) => [quote.id, quote]));

  const rows = orders.map((order) => {
    const quote = quoteById.get(order.quote_id);
    return [
      new Date(order.created_at).toLocaleDateString("fr-FR"),
      quote?.client_name ?? "",
      quote?.order_number ?? "",
      ORDER_STATUS_LABEL[order.status as OrderStatus],
    ];
  });

  const csv = toCsv(["Date", "Client", "N° commande", "Statut"], rows);
  return csvResponse(`mes-commandes-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
