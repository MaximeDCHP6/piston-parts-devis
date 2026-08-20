"use server";

import { createClient } from "@/lib/supabase/server";
import type { SearchResultItem } from "@/lib/types/search";

export async function adminGlobalSearch(query: string): Promise<SearchResultItem[]> {
  const q = query.trim().replace(/[,()]/g, "");
  if (q.length < 2) return [];

  const supabase = await createClient();
  const [{ data: quotes }, { data: resellers }, { data: products }, { data: clients }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, client_name, order_number, quote_number")
      .eq("type", "to_client")
      .or(`client_name.ilike.%${q}%,order_number.ilike.%${q}%,quote_number.ilike.%${q}%`)
      .limit(5),
    supabase.from("resellers").select("id, company_name").ilike("company_name", `%${q}%`).limit(5),
    supabase.from("products").select("id, sku, name").or(`name.ilike.%${q}%,sku.ilike.%${q}%`).limit(5),
    supabase.from("client_contacts").select("id, name, reseller_id").ilike("name", `%${q}%`).limit(5),
  ]);

  const results: SearchResultItem[] = [];

  for (const quote of quotes ?? []) {
    results.push({
      group: "Devis",
      label: quote.client_name ?? "Devis sans nom",
      sub: quote.order_number ? `N° commande : ${quote.order_number}` : quote.quote_number ?? undefined,
      href: `/admin/quotes/${quote.id}`,
    });
  }
  for (const reseller of resellers ?? []) {
    results.push({ group: "Revendeurs", label: reseller.company_name, href: `/admin/resellers/${reseller.id}` });
  }
  for (const product of products ?? []) {
    results.push({
      group: "Produits",
      label: product.name,
      sub: product.sku ?? undefined,
      href: `/admin/products/${product.id}`,
    });
  }
  for (const client of clients ?? []) {
    results.push({
      group: "Clients",
      label: client.name,
      href: `/admin/resellers/${client.reseller_id}/clients`,
    });
  }

  return results;
}
