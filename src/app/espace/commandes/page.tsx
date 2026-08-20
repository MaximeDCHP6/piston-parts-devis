import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/status";
import type { Order, OrderStatus } from "@/lib/types/database";

function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_LABEL;
}

export default async function EspaceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; client?: string }>;
}) {
  const { q, status, client } = await searchParams;
  const resellerId = await getCurrentResellerId();
  const supabase = await createClient();

  let matchingQuoteIds: string[] | null = null;
  if (client) {
    const { data: matchingQuotes } = await supabase
      .from("quotes")
      .select("id")
      .eq("reseller_id", resellerId ?? "")
      .eq("client_name", client);
    matchingQuoteIds = (matchingQuotes ?? []).map((r) => r.id);
  } else if (q) {
    const { data: matchingQuotes } = await supabase
      .from("quotes")
      .select("id")
      .eq("reseller_id", resellerId ?? "")
      .ilike("client_name", `%${q}%`);
    matchingQuoteIds = (matchingQuotes ?? []).map((r) => r.id);
  }

  let orders: Order[] = [];
  if (!matchingQuoteIds || matchingQuoteIds.length > 0) {
    let query = supabase
      .from("orders")
      .select("*")
      .eq("reseller_id", resellerId ?? "")
      .order("created_at", { ascending: false });

    if (matchingQuoteIds) query = query.in("quote_id", matchingQuoteIds);
    if (status && isOrderStatus(status)) query = query.eq("status", status);

    const { data } = await query;
    orders = data ?? [];
  }

  const quoteIds = orders.map((o) => o.quote_id);
  const [{ data: quotes }, { data: contacts }] = await Promise.all([
    quoteIds.length > 0
      ? supabase.from("quotes").select("id, client_name").in("id", quoteIds)
      : Promise.resolve({ data: [] as { id: string; client_name: string | null }[] }),
    supabase.from("client_contacts").select("name").eq("reseller_id", resellerId ?? "").order("name", { ascending: true }),
  ]);
  const clientNameByQuoteId = new Map((quotes ?? []).map((quoteRow) => [quoteRow.id, quoteRow.client_name]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Commandes" />

      <QuickFilters
        searchPlaceholder="Rechercher un client…"
        selectFilters={[
          {
            key: "client",
            label: "Tous les clients",
            options: (contacts ?? []).map((c) => ({ value: c.name, label: c.name })),
          },
          {
            key: "status",
            label: "Tous les statuts",
            options: Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      {orders.length === 0 ? (
        <EmptyState title="Aucune commande" description="Les commandes apparaissent ici dès qu'un client accepte son devis." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créée le</th>
                <th className="px-4 py-3 font-medium">Détail</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink">{clientNameByQuoteId.get(order.quote_id) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={ORDER_STATUS_TONE[order.status as OrderStatus]}>
                      {ORDER_STATUS_LABEL[order.status as OrderStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(order.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/espace/commandes/${order.id}`} className="text-sm text-accent hover:underline">
                      Voir la commande
                    </Link>
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
