import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export default async function EspaceDashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: reseller } = await supabase
    .from("resellers")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const resellerId = reseller?.id;

  const [{ count: quoteCount }, { count: orderCount }, { count: fileCount }] = await Promise.all([
    supabase.from("quotes").select("*", { count: "exact", head: true }).eq("reseller_id", resellerId ?? ""),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("reseller_id", resellerId ?? ""),
    supabase.from("reseller_files").select("*", { count: "exact", head: true }).eq("reseller_id", resellerId ?? ""),
  ]);

  const stats = [
    { label: "Devis", value: quoteCount ?? 0 },
    { label: "Commandes", value: orderCount ?? 0 },
    { label: "Documents", value: fileCount ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de vos devis et commandes." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
