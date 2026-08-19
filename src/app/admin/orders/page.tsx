import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL } from "@/lib/status";
import { OrderStatusSelect } from "./OrderStatusSelect";
import type { OrderStatus } from "@/lib/types/database";

function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_LABEL;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; reseller?: string }>;
}) {
  const { q, status, reseller } = await searchParams;
  const supabase = await createClient();

  let matchingQuoteIds: string[] | null = null;
  if (q) {
    const { data } = await supabase.from("quotes").select("id").ilike("client_name", `%${q}%`);
    matchingQuoteIds = (data ?? []).map((r) => r.id);
  }

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (matchingQuoteIds) {
    query = query.in("quote_id", matchingQuoteIds.length > 0 ? matchingQuoteIds : ["00000000-0000-0000-0000-000000000000"]);
  }
  if (status && isOrderStatus(status)) query = query.eq("status", status);
  if (reseller) query = query.eq("reseller_id", reseller);

  const [{ data: orders }, { data: resellers }] = await Promise.all([
    query,
    supabase.from("resellers").select("id, company_name").order("company_name", { ascending: true }),
  ]);

  const resellerNameById = new Map((resellers ?? []).map((r) => [r.id, r.company_name]));

  const quoteIds = (orders ?? []).map((o) => o.quote_id);
  const { data: quotes } =
    quoteIds.length > 0
      ? await supabase.from("quotes").select("id, client_name, parent_quote_id").in("id", quoteIds)
      : { data: [] as { id: string; client_name: string | null; parent_quote_id: string | null }[] };
  const quoteById = new Map((quotes ?? []).map((quoteRow) => [quoteRow.id, quoteRow]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Commandes" description="Commandes issues des devis acceptés par les clients finaux." />

      <QuickFilters
        searchPlaceholder="Rechercher un client…"
        selectFilters={[
          {
            key: "reseller",
            label: "Tous les revendeurs",
            options: (resellers ?? []).map((r) => ({ value: r.id, label: r.company_name })),
          },
          {
            key: "status",
            label: "Tous les statuts",
            options: Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      {!orders || orders.length === 0 ? (
        <EmptyState title="Aucune commande" description="Les commandes apparaissent ici dès qu'un client accepte un devis." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Revendeur</th>
                <th className="px-4 py-3 font-medium">Client final</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créée le</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const quote = quoteById.get(order.quote_id);
                return (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-ink">{resellerNameById.get(order.reseller_id) ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{quote?.client_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <OrderStatusSelect orderId={order.id} status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(order.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right">
                      {quote?.parent_quote_id && (
                        <Link href={`/admin/quotes/${quote.parent_quote_id}`} className="text-sm text-accent hover:underline">
                          Voir le devis
                        </Link>
                      )}
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
