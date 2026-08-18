import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { ResellerForm } from "../ResellerForm";
import { updateReseller, createResellerLogin } from "../actions";
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
        actions={<ButtonLink href={`/admin/resellers/${id}/files`} variant="secondary">Documents</ButtonLink>}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <ResellerForm action={updateReseller.bind(null, id)} reseller={reseller} />
        <ResellerLoginPanel
          resellerId={id}
          contactEmail={reseller.contact_email ?? ""}
          hasAccount={Boolean(reseller.user_id)}
          action={createResellerLogin.bind(null, id)}
        />
      </div>
    </div>
  );
}
