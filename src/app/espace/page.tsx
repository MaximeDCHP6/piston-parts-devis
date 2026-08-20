import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from "@/lib/status";
import { formatEUR } from "@/lib/quote-calc";
import type { OrderStatus, QuoteStatus } from "@/lib/types/database";

const QUOTE_PENDING: QuoteStatus[] = ["draft", "sent", "viewed"];
const ORDER_PENDING: OrderStatus[] = ["preparation", "expediee"];
const ORDER_DONE: OrderStatus[] = ["livree", "facturee"];

export default async function EspaceDashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: reseller } = await supabase
    .from("resellers")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const resellerId = reseller?.id ?? "";
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: quotes }, { data: orders }, { count: fileCount }, { count: clientCount }, { data: recentQuotes }] =
    await Promise.all([
      supabase.from("quotes").select("status").eq("reseller_id", resellerId),
      supabase.from("orders").select("status").eq("reseller_id", resellerId),
      supabase.from("reseller_files").select("*", { count: "exact", head: true }).eq("reseller_id", resellerId),
      supabase.from("client_contacts").select("*", { count: "exact", head: true }).eq("reseller_id", resellerId),
      supabase
        .from("quotes")
        .select("id, client_name, status, created_at")
        .eq("reseller_id", resellerId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const quotesPending = (quotes ?? []).filter((q) => QUOTE_PENDING.includes(q.status)).length;
  const quotesAccepted = (quotes ?? []).filter((q) => q.status === "accepted").length;
  const ordersPending = (orders ?? []).filter((o) => ORDER_PENDING.includes(o.status)).length;
  const ordersDone = (orders ?? []).filter((o) => ORDER_DONE.includes(o.status)).length;

  const { data: monthAcceptedQuotes } = await supabase
    .from("quotes")
    .select("id")
    .eq("reseller_id", resellerId)
    .eq("status", "accepted")
    .gte("accepted_at", startOfMonth);
  const monthQuoteIds = (monthAcceptedQuotes ?? []).map((q) => q.id);

  const { data: monthLines } =
    monthQuoteIds.length > 0
      ? await supabase.from("quote_lines").select("id, quote_id, quantity").in("quote_id", monthQuoteIds)
      : { data: [] as { id: string; quote_id: string; quantity: number }[] };
  const lineIds = (monthLines ?? []).map((l) => l.id);
  const { data: monthCosts } =
    lineIds.length > 0
      ? await supabase.from("quote_line_costs").select("*").in("quote_line_id", lineIds)
      : { data: [] as { quote_line_id: string; cost_price: number }[] };
  const costByLineId = new Map((monthCosts ?? []).map((c) => [c.quote_line_id, c.cost_price]));
  const monthOwedHT = (monthLines ?? []).reduce((sum, line) => sum + line.quantity * (costByLineId.get(line.id) ?? 0), 0);

  const stats = [
    { label: "Devis en attente", value: quotesPending },
    { label: "Devis acceptés", value: quotesAccepted },
    { label: "Commandes en attente", value: ordersPending },
    { label: "Commandes terminées", value: ordersDone },
    { label: "Dû ce mois-ci (HT)", value: formatEUR(monthOwedHT) },
    { label: "Clients enregistrés", value: clientCount ?? 0 },
    { label: "Documents", value: fileCount ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Tableau de bord" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-1 font-display text-3xl text-ink">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
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
                  <Link href={`/espace/devis/${quote.id}`} className="text-ink hover:underline">
                    {quote.client_name ?? "—"}
                  </Link>
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
