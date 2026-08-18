import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from "@/lib/status";
import type { QuoteStatus, QuoteType } from "@/lib/types/database";

const TYPE_LABEL: Record<QuoteType, string> = {
  to_reseller: "Devis fournisseur",
  to_client: "Devis client final",
};

function isQuoteStatus(value: string): value is QuoteStatus {
  return value in QUOTE_STATUS_LABEL;
}

export default async function EspaceDevisPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const { q, status, type } = await searchParams;
  const resellerId = await getCurrentResellerId();
  const supabase = await createClient();

  let query = supabase
    .from("quotes")
    .select("*")
    .eq("reseller_id", resellerId ?? "")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("client_name", `%${q}%`);
  if (status && isQuoteStatus(status)) query = query.eq("status", status);
  if (type === "to_reseller" || type === "to_client") query = query.eq("type", type);

  const { data: quotes } = await query;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Devis" description="Vos devis fournisseur et ceux adressés à vos clients." />

      <QuickFilters
        searchPlaceholder="Rechercher un client…"
        selectFilters={[
          {
            key: "type",
            label: "Tous les types",
            options: [
              { value: "to_reseller", label: "Devis fournisseur" },
              { value: "to_client", label: "Devis client final" },
            ],
          },
          {
            key: "status",
            label: "Tous les statuts",
            options: Object.entries(QUOTE_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      {!quotes || quotes.length === 0 ? (
        <EmptyState title="Aucun devis" description="Vos devis apparaîtront ici dès qu'ils seront créés." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink">
                    <Link href={`/espace/devis/${quote.id}`} className="hover:underline">
                      {TYPE_LABEL[quote.type as QuoteType]}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{quote.client_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={QUOTE_STATUS_TONE[quote.status as QuoteStatus]}>
                      {QUOTE_STATUS_LABEL[quote.status as QuoteStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(quote.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
