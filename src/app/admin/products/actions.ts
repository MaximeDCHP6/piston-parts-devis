"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ProductSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  sku: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  purchase_price: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null)),
});

export interface ProductFormState {
  error: string | null;
}

function parseProduct(formData: FormData) {
  return ProductSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    category: formData.get("category"),
    purchase_price: formData.get("purchase_price"),
  });
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProduct(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    name: parsed.data.name,
    sku: parsed.data.sku || null,
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    purchase_price: parsed.data.purchase_price,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProduct(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      purchase_price: parsed.data.purchase_price,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
}
