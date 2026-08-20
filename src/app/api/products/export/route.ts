import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv, csvResponse } from "@/lib/csv";
import type { Product } from "@/lib/types/database";

const BATCH_SIZE = 1000;

// Reprend les filtres de /admin/products. Contrairement à la page (paginée
// pour l'affichage), l'export récupère tout le résultat filtré par lots de
// 1000 lignes (plafond Postgrest par requête).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const safeQ = q?.replace(/[,()]/g, "").trim();

  const supabase = await createClient();
  const rows: Product[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true })
      .range(from, from + BATCH_SIZE - 1);
    if (safeQ) query = query.or(`name.ilike.%${safeQ}%,sku.ilike.%${safeQ}%`);
    if (category) query = query.eq("category", category);

    const { data } = await query;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  const csv = toCsv(
    ["sku", "name", "description", "category", "purchase_price"],
    rows.map((p) => [p.sku ?? "", p.name, p.description ?? "", p.category ?? "", p.purchase_price ?? ""]),
  );

  return csvResponse(`produits-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
