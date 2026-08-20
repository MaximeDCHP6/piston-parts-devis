import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL } from "@/lib/status";
import { toCsv, csvResponse } from "@/lib/csv";
import type { OrderStatus } from "@/lib/types/database";

function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_LABEL;
}

// Reprend exactement les filtres de /admin/orders.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const reseller = searchParams.get("reseller") ?? undefined;

  const supabase = await createClient();

  let matchingQuoteIds: string[] | null = null;
  if (q) {
    const { data } = await supabase.from("quotes").select("id").ilike("client_name", `%${q}%`);
    matchingQuoteIds = (data ?? []).map((r) => r.id);
  }

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (matchingQuoteIds) {
    query = query.in("quote_id", matchingQuoteIds.length > 0 ? matchingQuoteIds : ["00000000-0000-0000-0000-000000000000"]);
  }
  if (status && isOrderStatus(status)) query = query.eq("status", status);
  if (reseller) query = query.eq("reseller_id", reseller);

  const [{ data: orders }, { data: resellers }] = await Promise.all([
    query,
    supabase.from("resellers").select("id, company_name"),
  ]);
  const resellerNameById = new Map((resellers ?? []).map((r) => [r.id, r.company_name]));

  const quoteIds = (orders ?? []).map((o) => o.quote_id);
  const { data: quotes } =
    quoteIds.length > 0
      ? await supabase.from("quotes").select("id, client_name, order_number").in("id", quoteIds)
      : { data: [] as { id: string; client_name: string | null; order_number: string | null }[] };
  const quoteById = new Map((quotes ?? []).map((quote) => [quote.id, quote]));

  const rows = (orders ?? []).map((order) => {
    const quote = quoteById.get(order.quote_id);
    return [
      new Date(order.created_at).toLocaleDateString("fr-FR"),
      resellerNameById.get(order.reseller_id) ?? "",
      quote?.client_name ?? "",
      quote?.order_number ?? "",
      ORDER_STATUS_LABEL[order.status as OrderStatus],
    ];
  });

  const csv = toCsv(["Date", "Revendeur", "Client final", "N° commande", "Statut"], rows);
  return csvResponse(`commandes-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
