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

const ACTIONABLE_STATUSES: QuoteStatus[] = ["draft", "sent", "viewed"];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; reseller?: string; status?: string; from?: string; to?: string; expiring?: string }>;
}) {
  const { q, reseller, status, from, to, expiring } = await searchParams;
  const supabase = await createClient();
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  let query = supabase
    .from("quotes")
    .select("*")
    .eq("type", "to_client")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`client_name.ilike.%${q}%,order_number.ilike.%${q}%`);
  if (reseller) query = query.eq("reseller_id", reseller);
  if (status && isQuoteStatus(status)) query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);
  if (expiring) query = query.gte("valid_until", today).lte("valid_until", in7Days).in("status", ACTIONABLE_STATUSES);

  const [{ data: quotes }, { data: resellers }, { count: expiringCount }] = await Promise.all([
    query,
    supabase.from("resellers").select("id, company_name").order("company_name", { ascending: true }),
    supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("type", "to_client")
      .gte("valid_until", today)
      .lte("valid_until", in7Days)
      .in("status", ACTIONABLE_STATUSES),
  ]);

  const resellerNameById = new Map((resellers ?? []).map((r) => [r.id, r.company_name]));

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (reseller) exportParams.set("reseller", reseller);
  if (status) exportParams.set("status", status);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  const exportQs = exportParams.toString();

  const toggleExpiringParams = new URLSearchParams(exportParams);
  if (!expiring) toggleExpiringParams.set("expiring", "1");
  const toggleExpiringQs = toggleExpiringParams.toString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Devis"
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink href={`/api/quotes/export${exportQs ? `?${exportQs}` : ""}`} variant="secondary">
              Exporter CSV
            </ButtonLink>
            <ButtonLink href="/admin/quotes/new">Nouveau devis</ButtonLink>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <QuickFilters
          searchPlaceholder="Client final ou n° de commande…"
          dateRange={{ fromKey: "from", toKey: "to" }}
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
        {(expiringCount ?? 0) > 0 && (
          <Link
            href={`/admin/quotes${toggleExpiringQs ? `?${toggleExpiringQs}` : ""}`}
            className={expiring ? "text-sm font-medium text-warning underline" : "text-sm text-muted hover:text-warning"}
          >
            {expiring ? "✕ Bientôt expirés" : `Bientôt expirés (${expiringCount})`}
          </Link>
        )}
      </div>

      {!quotes || quotes.length === 0 ? (
        <EmptyState
          title="Aucun devis"
          description="Créez votre premier devis pour le client d'un revendeur."
          action={<ButtonLink href="/admin/quotes/new">Nouveau devis</ButtonLink>}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Client final</th>
                <th className="px-4 py-3 font-medium">Revendeur</th>
                <th className="px-4 py-3 font-medium">N° commande</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
                <th className="px-4 py-3 font-medium">Validité</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const expiresSoon =
                  quote.valid_until &&
                  quote.valid_until >= today &&
                  quote.valid_until <= in7Days &&
                  ACTIONABLE_STATUSES.includes(quote.status);
                return (
                  <tr key={quote.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-ink">
                      <Link href={`/admin/quotes/${quote.id}`} className="hover:underline">
                        {quote.client_name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{resellerNameById.get(quote.reseller_id) ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{quote.order_number ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={QUOTE_STATUS_TONE[quote.status as QuoteStatus]}>
                        {QUOTE_STATUS_LABEL[quote.status as QuoteStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(quote.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className={expiresSoon ? "px-4 py-3 font-medium text-warning" : "px-4 py-3 text-muted"}>
                      {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
