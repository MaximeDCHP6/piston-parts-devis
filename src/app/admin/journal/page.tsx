import { PageHeader } from "@/components/ui/PageHeader";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AUDIT_ACTION_LABEL } from "@/lib/audit";

const ENTITY_TYPE_LABEL: Record<string, string> = {
  quote: "Devis",
  reseller: "Revendeur",
  profile: "Administrateur",
};

function toneForAction(action: string): "neutral" | "accent" | "success" | "danger" | "warning" {
  if (action.endsWith(".deleted")) return "danger";
  if (action.endsWith(".accepted") || action.endsWith(".created")) return "success";
  if (action.endsWith(".refused") || action.endsWith(".unaccepted")) return "warning";
  return "neutral";
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const { entity } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(150);
  if (entity) query = query.eq("entity_type", entity);
  const { data: logs } = await query;

  const actorIds = Array.from(new Set((logs ?? []).map((l) => l.actor_id).filter((v): v is string => !!v)));
  const serviceClient = createServiceClient();
  const emailById = new Map<string, string>();
  await Promise.all(
    actorIds.map(async (id) => {
      const { data } = await serviceClient.auth.admin.getUserById(id);
      if (data.user?.email) emailById.set(id, data.user.email);
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Journal d'activité" />

      <QuickFilters
        showSearch={false}
        selectFilters={[
          {
            key: "entity",
            label: "Tous les types",
            options: Object.entries(ENTITY_TYPE_LABEL).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      {!logs || logs.length === 0 ? (
        <EmptyState title="Aucune activité" description="Les actions admin (devis, revendeurs, comptes) apparaîtront ici." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Par</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForAction(log.action)}>{AUDIT_ACTION_LABEL[log.action] ?? log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{log.entity_type ? ENTITY_TYPE_LABEL[log.entity_type] ?? log.entity_type : "—"}</td>
                  <td className="px-4 py-3 text-muted">{log.actor_id ? emailById.get(log.actor_id) ?? "—" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
