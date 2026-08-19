import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { createClient } from "@/lib/supabase/server";
import { uploadResellerFile, deleteResellerFile } from "./actions";
import { UploadFileForm } from "./UploadFileForm";
import { RESELLER_FILE_TYPE_LABEL, RESELLER_FILE_TYPE_TONE } from "@/lib/status";

export default async function ResellerFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reseller } = await supabase.from("resellers").select("company_name").eq("id", id).single();
  if (!reseller) notFound();

  const { data: files } = await supabase
    .from("reseller_files")
    .select("*")
    .eq("reseller_id", id)
    .order("uploaded_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Documents — ${reseller.company_name}`} description="Factures et documents à mettre à disposition du revendeur." />

      <Card>
        <CardBody>
          <UploadFileForm action={uploadResellerFile.bind(null, id)} />
        </CardBody>
      </Card>

      {!files || files.length === 0 ? (
        <EmptyState title="Aucun document déposé" />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Déposé le</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-ink">{file.label ?? "Document"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={RESELLER_FILE_TYPE_TONE[file.type]}>{RESELLER_FILE_TYPE_LABEL[file.type]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(file.uploaded_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteResellerFile}>
                      <input type="hidden" name="id" value={file.id} />
                      <input type="hidden" name="resellerId" value={id} />
                      <input type="hidden" name="path" value={file.file_url} />
                      <ConfirmSubmitButton confirmMessage={`Supprimer "${file.label ?? "ce document"}" ?`}>
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
