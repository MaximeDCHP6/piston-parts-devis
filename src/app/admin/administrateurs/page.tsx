import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUser } from "@/lib/auth";
import { AdminCreateForm } from "./AdminCreateForm";
import { AdminResetButton } from "./AdminResetButton";
import { AdminDeleteButton } from "./AdminDeleteButton";

export default async function AdministratorsPage() {
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("id, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  const serviceClient = createServiceClient();
  const admins = await Promise.all(
    (adminProfiles ?? []).map(async (p) => {
      const { data } = await serviceClient.auth.admin.getUserById(p.id);
      return { id: p.id, email: data.user?.email ?? "—", createdAt: p.created_at };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Administrateurs" />

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Créer un accès</p>
        </CardHeader>
        <CardBody>
          <AdminCreateForm />
        </CardBody>
      </Card>

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">
                  {admin.email}
                  {admin.id === currentUser?.id && <span className="ml-2 text-xs text-muted">(vous)</span>}
                </td>
                <td className="px-4 py-3 text-muted">{new Date(admin.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-start justify-end gap-3">
                    <AdminResetButton userId={admin.id} />
                    {admin.id !== currentUser?.id && <AdminDeleteButton userId={admin.id} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
