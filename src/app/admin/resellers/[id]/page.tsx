import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { createClient } from "@/lib/supabase/server";
import { ResellerForm } from "../ResellerForm";
import { updateReseller, createResellerLogin, resetResellerPassword, deleteReseller } from "../actions";
import { ResellerLoginPanel } from "./ResellerLoginPanel";

export default async function EditResellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: reseller } = await supabase.from("resellers").select("*").eq("id", id).single();

  if (!reseller) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={reseller.company_name}
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink href={`/admin/resellers/${id}/clients`} variant="secondary">
              Clients
            </ButtonLink>
            <ButtonLink href={`/admin/resellers/${id}/files`} variant="secondary">
              Documents
            </ButtonLink>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <ResellerForm action={updateReseller.bind(null, id)} reseller={reseller} />
        <ResellerLoginPanel
          resellerId={id}
          contactEmail={reseller.contact_email ?? ""}
          hasAccount={Boolean(reseller.user_id)}
          action={createResellerLogin.bind(null, id)}
          resetAction={resetResellerPassword.bind(null, id)}
        />
      </div>

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-danger">Zone dangereuse</p>
        </CardHeader>
        <CardBody>
          <form action={deleteReseller} className="flex items-center justify-between gap-4">
            <input type="hidden" name="id" value={id} />
            <p className="text-sm text-muted">
              Supprime ce revendeur, son compte de connexion, ainsi que tous ses devis, commandes, clients et
              documents associés. Action irréversible.
            </p>
            <ConfirmSubmitButton
              confirmMessage={`Supprimer définitivement "${reseller.company_name}" et toutes ses données (devis, commandes, clients, documents) ? Cette action est irréversible.`}
              className="shrink-0"
            >
              Supprimer ce revendeur
            </ConfirmSubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
