"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ImportState {
  error: string | null;
}

export async function importProductsCsv(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier CSV." };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return { error: `Erreur de lecture du CSV : ${parsed.errors[0].message}` };
  }

  const rows = parsed.data
    .map((row) => ({
      sku: row.sku?.trim() || null,
      name: row.name?.trim() || "",
      description: row.description?.trim() || null,
      category: row.category?.trim() || null,
      purchase_price: row.purchase_price ? Number(row.purchase_price.replace(",", ".")) || null : null,
    }))
    .filter((row) => row.name.length > 0);

  if (rows.length === 0) {
    return { error: "Aucune ligne valide trouvée (colonne \"name\" requise)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  redirect("/admin/products");
}
