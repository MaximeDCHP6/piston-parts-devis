import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";

export default async function ResellersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("resellers").select("*").order("company_name", { ascending: true });
  if (q) query = query.ilike("company_name", `%${q}%`);
  const { data: resellers } = await query;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Revendeurs"
        description="Sociétés partenaires et leur configuration de marque blanche."
        actions={<ButtonLink href="/admin/resellers/new">Nouveau revendeur</ButtonLink>}
      />

      <QuickFilters searchPlaceholder="Rechercher un revendeur…" />

      {!resellers || resellers.length === 0 ? (
        <EmptyState
          title="Aucun revendeur"
          description="Ajoutez votre premier revendeur pour commencer à créer des devis."
          action={<ButtonLink href="/admin/resellers/new">Nouveau revendeur</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Société</th>
                <th className="px-4 py-3 font-medium">Marge</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Accès</th>
              </tr>
            </thead>
            <tbody>
              {resellers.map((reseller) => (
                <tr key={reseller.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink">
                    <Link href={`/admin/resellers/${reseller.id}`} className="hover:underline">
                      {reseller.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{reseller.margin_percent}%</td>
                  <td className="px-4 py-3 text-muted">{reseller.contact_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={reseller.user_id ? "success" : "warning"}>
                      {reseller.user_id ? "Actif" : "Sans compte"}
                    </Badge>
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
