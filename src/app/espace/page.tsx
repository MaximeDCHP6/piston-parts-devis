import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
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

  const [{ data: quotes }, { data: orders }, { count: fileCount }, { count: clientCount }] = await Promise.all([
    supabase.from("quotes").select("status").eq("reseller_id", resellerId),
    supabase.from("orders").select("status").eq("reseller_id", resellerId),
    supabase.from("reseller_files").select("*", { count: "exact", head: true }).eq("reseller_id", resellerId),
    supabase.from("client_contacts").select("*", { count: "exact", head: true }).eq("reseller_id", resellerId),
  ]);

  const quotesPending = (quotes ?? []).filter((q) => QUOTE_PENDING.includes(q.status)).length;
  const quotesAccepted = (quotes ?? []).filter((q) => q.status === "accepted").length;
  const ordersPending = (orders ?? []).filter((o) => ORDER_PENDING.includes(o.status)).length;
  const ordersDone = (orders ?? []).filter((o) => ORDER_DONE.includes(o.status)).length;

  const stats = [
    { label: "Devis en attente", value: quotesPending },
    { label: "Devis acceptés", value: quotesAccepted },
    { label: "Commandes en attente", value: ordersPending },
    { label: "Commandes terminées", value: ordersDone },
    { label: "Clients enregistrés", value: clientCount ?? 0 },
    { label: "Documents", value: fileCount ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de vos devis et commandes." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-1 font-display text-3xl text-ink">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
