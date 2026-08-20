import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from "@/lib/status";
import { quoteTotals, formatEUR } from "@/lib/quote-calc";
import type { QuoteStatus } from "@/lib/types/database";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: resellerCount },
    { count: quoteCount },
    { count: orderCount },
    { data: allStatuses },
    { data: monthQuotes },
    { data: recentQuotes },
    { data: resellers },
  ] = await Promise.all([
    supabase.from("resellers").select("*", { count: "exact", head: true }),
    supabase.from("quotes").select("*", { count: "exact", head: true }).eq("type", "to_client"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("quotes").select("status, reseller_id").eq("type", "to_client"),
    supabase.from("quotes").select("id, status").eq("type", "to_client").gte("created_at", startOfMonth),
    supabase
      .from("quotes")
      .select("id, client_name, status, created_at, reseller_id")
      .eq("type", "to_client")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("resellers").select("id, company_name"),
  ]);

  const resellerNameById = new Map((resellers ?? []).map((r) => [r.id, r.company_name]));

  const acceptedThisMonthIds = (monthQuotes ?? []).filter((q) => q.status === "accepted").map((q) => q.id);
  const { data: acceptedLines } =
    acceptedThisMonthIds.length > 0
      ? await supabase.from("quote_lines").select("quote_id, quantity, unit_price, discount_percent, vat_rate").in("quote_id", acceptedThisMonthIds)
      : { data: [] };
  const monthRevenueHT = quoteTotals(acceptedLines ?? []).totalHT;

  const statusCounts = new Map<string, number>();
  for (const q of allStatuses ?? []) statusCounts.set(q.status, (statusCounts.get(q.status) ?? 0) + 1);

  const resellerCounts = new Map<string, number>();
  for (const q of allStatuses ?? []) resellerCounts.set(q.reseller_id, (resellerCounts.get(q.reseller_id) ?? 0) + 1);
  const topResellers = Array.from(resellerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stats = [
    { label: "Revendeurs", value: resellerCount ?? 0 },
    { label: "Devis", value: quoteCount ?? 0 },
    { label: "Commandes", value: orderCount ?? 0 },
    { label: "Devis ce mois-ci", value: (monthQuotes ?? []).length },
    { label: "CA accepté ce mois-ci (HT)", value: formatEUR(monthRevenueHT) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Tableau de bord" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-1 font-display text-3xl text-ink">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="font-display text-lg text-ink">Devis par statut</p>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {(Object.keys(QUOTE_STATUS_LABEL) as QuoteStatus[]).map((status) => (
              <Badge key={status} tone={QUOTE_STATUS_TONE[status]}>
                {QUOTE_STATUS_LABEL[status]} · {statusCounts.get(status) ?? 0}
              </Badge>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-display text-lg text-ink">Revendeurs les plus actifs</p>
          </CardHeader>
          <CardBody>
            {topResellers.length === 0 ? (
              <p className="text-sm text-muted">Aucun devis pour l&apos;instant.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {topResellers.map(([resellerId, count]) => (
                  <li key={resellerId} className="flex items-center justify-between text-sm">
                    <Link href={`/admin/resellers/${resellerId}`} className="text-ink hover:underline">
                      {resellerNameById.get(resellerId) ?? "—"}
                    </Link>
                    <span className="font-mono text-muted">{count} devis</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Devis récents</p>
        </CardHeader>
        <CardBody>
          {!recentQuotes || recentQuotes.length === 0 ? (
            <p className="text-sm text-muted">Aucun devis pour l&apos;instant.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentQuotes.map((quote) => (
                <li key={quote.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/admin/quotes/${quote.id}`} className="text-ink hover:underline">
                    {quote.client_name ?? "—"}
                  </Link>
                  <span className="text-muted">{resellerNameById.get(quote.reseller_id) ?? "—"}</span>
                  <Badge tone={QUOTE_STATUS_TONE[quote.status as QuoteStatus]}>
                    {QUOTE_STATUS_LABEL[quote.status as QuoteStatus]}
                  </Badge>
                  <span className="font-mono text-xs text-muted">{new Date(quote.created_at).toLocaleDateString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
