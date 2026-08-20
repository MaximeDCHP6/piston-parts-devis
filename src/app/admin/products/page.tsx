import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "./actions";
import Link from "next/link";

const PAGE_SIZE = 50;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string; noPrice?: string }>;
}) {
  const { q, category, page: pageParam, noPrice } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  // .or() a une syntaxe de filtre propre à Postgrest : on retire les
  // caractères qui la casseraient si l'admin les tape dans la recherche.
  const safeQ = q?.replace(/[,()]/g, "").trim();
  if (safeQ) query = query.or(`name.ilike.%${safeQ}%,sku.ilike.%${safeQ}%`);
  if (category) query = query.eq("category", category);
  if (noPrice) query = query.or("purchase_price.is.null,purchase_price.eq.0");

  const [{ data: products, count }, { data: categoryRows }, { count: noPriceCount }] = await Promise.all([
    query,
    supabase.from("products").select("category").not("category", "is", null),
    supabase.from("products").select("*", { count: "exact", head: true }).or("purchase_price.is.null,purchase_price.eq.0"),
  ]);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categories = Array.from(new Set((categoryRows ?? []).map((r) => r.category).filter(Boolean))) as string[];

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (noPrice) params.set("noPrice", "1");
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (category) exportParams.set("category", category);
  const exportQs = exportParams.toString();

  const toggleNoPriceParams = new URLSearchParams();
  if (q) toggleNoPriceParams.set("q", q);
  if (category) toggleNoPriceParams.set("category", category);
  if (!noPrice) toggleNoPriceParams.set("noPrice", "1");
  const toggleNoPriceQs = toggleNoPriceParams.toString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalogue produits"
        description={`${total.toLocaleString("fr-FR")} produit${total > 1 ? "s" : ""} au total — page ${page}/${totalPages}.`}
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink href={`/api/products/export${exportQs ? `?${exportQs}` : ""}`} variant="secondary">
              Exporter CSV
            </ButtonLink>
            <ButtonLink href="/admin/products/import" variant="secondary">
              Importer CSV
            </ButtonLink>
            <ButtonLink href="/admin/products/new">Nouveau produit</ButtonLink>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
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
        {(noPriceCount ?? 0) > 0 && (
          <Link
            href={`/admin/products${toggleNoPriceQs ? `?${toggleNoPriceQs}` : ""}`}
            className={noPrice ? "text-sm font-medium text-accent underline" : "text-sm text-muted hover:text-accent"}
          >
            {noPrice ? "✕ Sans prix" : `Sans prix (${noPriceCount})`}
          </Link>
        )}
      </div>

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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <ButtonLink
            href={pageHref(page - 1)}
            variant="secondary"
            size="sm"
            className={page <= 1 ? "pointer-events-none opacity-40" : undefined}
          >
            Précédent
          </ButtonLink>
          <p className="font-mono text-xs text-muted">
            Page {page} / {totalPages}
          </p>
          <ButtonLink
            href={pageHref(page + 1)}
            variant="secondary"
            size="sm"
            className={page >= totalPages ? "pointer-events-none opacity-40" : undefined}
          >
            Suivant
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
