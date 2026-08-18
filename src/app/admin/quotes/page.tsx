import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from "@/lib/status";
import type { QuoteStatus } from "@/lib/types/database";

function isQuoteStatus(value: string): value is QuoteStatus {
  return value in QUOTE_STATUS_LABEL;
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; reseller?: string; status?: string }>;
}) {
  const { q, reseller, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("quotes")
    .select("*")
    .eq("type", "to_reseller")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("client_name", `%${q}%`);
  if (reseller) query = query.eq("reseller_id", reseller);
  if (status && isQuoteStatus(status)) query = query.eq("status", status);

  const [{ data: quotes }, { data: resellers }] = await Promise.all([
    query,
    supabase.from("resellers").select("id, company_name").order("company_name", { ascending: true }),
  ]);

  const resellerNameById = new Map((resellers ?? []).map((r) => [r.id, r.company_name]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Devis"
        description="Devis établis pour vos revendeurs."
        actions={<ButtonLink href="/admin/quotes/new">Nouveau devis</ButtonLink>}
      />

      <QuickFilters
        searchPlaceholder="Rechercher un client final…"
        selectFilters={[
          {
            key: "reseller",
            label: "Tous les revendeurs",
            options: (resellers ?? []).map((r) => ({ value: r.id, label: r.company_name })),
          },
          {
            key: "status",
            label: "Tous les statuts",
            options: Object.entries(QUOTE_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      {!quotes || quotes.length === 0 ? (
        <EmptyState
          title="Aucun devis"
          description="Créez votre premier devis pour un revendeur."
          action={<ButtonLink href="/admin/quotes/new">Nouveau devis</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Revendeur</th>
                <th className="px-4 py-3 font-medium">Client final</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink">
                    <Link href={`/admin/quotes/${quote.id}`} className="hover:underline">
                      {resellerNameById.get(quote.reseller_id) ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{quote.client_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={QUOTE_STATUS_TONE[quote.status as QuoteStatus]}>
                      {QUOTE_STATUS_LABEL[quote.status as QuoteStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(quote.created_at).toLocaleDateString("fr-FR")}
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
