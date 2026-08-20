import { PageHeader } from "@/components/ui/PageHeader";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import { RESELLER_FILE_TYPE_LABEL, RESELLER_FILE_TYPE_TONE, isResellerFileType } from "@/lib/status";

export default async function EspaceDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const resellerId = await getCurrentResellerId();
  const supabase = await createClient();

  let query = supabase
    .from("reseller_files")
    .select("*")
    .eq("reseller_id", resellerId ?? "")
    .order("uploaded_at", { ascending: false });

  if (type && isResellerFileType(type)) query = query.eq("type", type);

  const { data: files } = await query;

  const paths = (files ?? []).map((f) => f.file_url);
  const { data: signedUrls } =
    paths.length > 0 ? await supabase.storage.from("reseller-files").createSignedUrls(paths, 300) : { data: [] };
  const signedUrlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Documents" />

      <QuickFilters
        showSearch={false}
        selectFilters={[
          {
            key: "type",
            label: "Tous les documents",
            options: Object.entries(RESELLER_FILE_TYPE_LABEL).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      {!files || files.length === 0 ? (
        <EmptyState title="Aucun document" description="Vos factures et documents apparaîtront ici." />
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
              {files.map((file) => {
                const signedUrl = signedUrlByPath.get(file.file_url);
                return (
                  <tr key={file.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-ink">{file.label ?? "Document"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={RESELLER_FILE_TYPE_TONE[file.type]}>{RESELLER_FILE_TYPE_LABEL[file.type]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(file.uploaded_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-right">
                      {signedUrl ? (
                        <a
                          href={signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-accent hover:underline"
                        >
                          Télécharger
                        </a>
                      ) : (
                        <span className="text-sm text-muted">Indisponible</span>
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
