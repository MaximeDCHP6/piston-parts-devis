import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "./actions";
import Link from "next/link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("products").select("*").order("name", { ascending: true });
  if (q) query = query.ilike("name", `%${q}%`);
  if (category) query = query.eq("category", category);

  const [{ data: products }, { data: categoryRows }] = await Promise.all([
    query,
    supabase.from("products").select("category").not("category", "is", null),
  ]);

  const categories = Array.from(new Set((categoryRows ?? []).map((r) => r.category).filter(Boolean))) as string[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalogue produits"
        description="Produits réutilisables dans la création de devis."
        actions={<ButtonLink href="/admin/products/new">Nouveau produit</ButtonLink>}
      />

      <QuickFilters
        searchPlaceholder="Rechercher un produit…"
        selectFilters={[
          {
            key: "category",
            label: "Toutes catégories",
            options: categories.map((c) => ({ value: c, label: c })),
          },
        ]}
      />

      {!products || products.length === 0 ? (
        <EmptyState
          title="Aucun produit"
          description="Ajoutez votre premier produit pour pouvoir l'utiliser dans un devis."
          action={<ButtonLink href="/admin/products/new">Nouveau produit</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Prix d&apos;achat</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink">
                    <Link href={`/admin/products/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{product.sku ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{product.category ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {product.purchase_price != null ? `${product.purchase_price.toFixed(2)} €` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/products/${product.id}`} className="text-sm text-ink hover:underline">
                        Modifier
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <ConfirmSubmitButton confirmMessage={`Supprimer le produit "${product.name}" ?`}>
                          Supprimer
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
