"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import type { SearchResultItem } from "@/lib/types/search";

export async function resellerGlobalSearch(query: string): Promise<SearchResultItem[]> {
  const q = query.trim().replace(/[,()]/g, "");
  if (q.length < 2) return [];

  const resellerId = await getCurrentResellerId();
  const supabase = await createClient();
  const [{ data: quotes }, { data: clients }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, client_name, order_number")
      .eq("reseller_id", resellerId ?? "")
      .or(`client_name.ilike.%${q}%,order_number.ilike.%${q}%`)
      .limit(8),
    supabase
      .from("client_contacts")
      .select("id, name")
      .eq("reseller_id", resellerId ?? "")
      .ilike("name", `%${q}%`)
      .limit(5),
  ]);

  const results: SearchResultItem[] = [];
  for (const quote of quotes ?? []) {
    results.push({
      group: "Devis",
      label: quote.client_name ?? "Devis sans nom",
      sub: quote.order_number ? `N° commande : ${quote.order_number}` : undefined,
      href: `/espace/devis/${quote.id}`,
    });
  }
  for (const client of clients ?? []) {
    results.push({ group: "Clients", label: client.name, href: "/espace/devis" });
  }

  return results;
}
