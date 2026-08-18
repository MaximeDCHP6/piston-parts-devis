import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: resellerCount }, { count: quoteCount }, { count: orderCount }] = await Promise.all([
    supabase.from("resellers").select("*", { count: "exact", head: true }),
    supabase.from("quotes").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Revendeurs", value: resellerCount ?? 0 },
    { label: "Devis", value: quoteCount ?? 0 },
    { label: "Commandes", value: orderCount ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de l'activité." />
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
