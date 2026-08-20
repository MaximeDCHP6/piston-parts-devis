import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { createClient } from "@/lib/supabase/server";
import { createClientContact, deleteClientContact } from "./actions";
import { ClientContactForm } from "./ClientContactForm";

export default async function ResellerClientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reseller } = await supabase.from("resellers").select("company_name").eq("id", id).single();
  if (!reseller) notFound();

  const { data: contacts } = await supabase
    .from("client_contacts")
    .select("*")
    .eq("reseller_id", id)
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Clients — ${reseller.company_name}`} />

      <Card>
        <CardBody>
          <ClientContactForm action={createClientContact.bind(null, id)} />
        </CardBody>
      </Card>

      {!contacts || contacts.length === 0 ? (
        <EmptyState title="Aucun client enregistré" description="Les adresses saisies lors de la création d'un devis sont aussi enregistrées automatiquement ici." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Adresse</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink">{contact.name}</td>
                  <td className="px-4 py-3 text-muted">{contact.email ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-pre-line text-muted">{contact.address ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteClientContact}>
                      <input type="hidden" name="id" value={contact.id} />
                      <input type="hidden" name="resellerId" value={id} />
                      <ConfirmSubmitButton confirmMessage={`Supprimer le client "${contact.name}" ?`}>
                        Supprimer
                      </ConfirmSubmitButton>
                    </form>
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
