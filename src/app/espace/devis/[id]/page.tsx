import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { QuoteLinesTable } from "@/components/quotes/QuoteLinesTable";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, RESELLER_FILE_TYPE_LABEL, RESELLER_FILE_TYPE_TONE } from "@/lib/status";
import type { QuoteStatus } from "@/lib/types/database";

export default async function EspaceQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resellerId = await getCurrentResellerId();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("reseller_id", resellerId ?? "")
    .single();

  if (!quote) notFound();

  const [{ data: lines }, { data: files }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", id).order("line_order", { ascending: true }),
    supabase.from("reseller_files").select("*").eq("quote_id", id).order("uploaded_at", { ascending: false }),
  ]);

  const paths = (files ?? []).map((f) => f.file_url);
  const { data: signedUrls } =
    paths.length > 0 ? await supabase.storage.from("reseller-files").createSignedUrls(paths, 300) : { data: [] };
  const signedUrlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={quote.client_name ?? "Devis"}
        description={quote.order_number ? `N° commande : ${quote.order_number}` : undefined}
        actions={<Badge tone={QUOTE_STATUS_TONE[quote.status as QuoteStatus]}>{QUOTE_STATUS_LABEL[quote.status as QuoteStatus]}</Badge>}
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-display text-lg text-ink">Détail</p>
          <ButtonLink href={`/api/quotes/${id}/pdf`} variant="secondary" size="sm">
            Télécharger le PDF
          </ButtonLink>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {lines && lines.length > 0 ? <QuoteLinesTable lines={lines} /> : <p className="text-sm text-muted">Aucune ligne.</p>}

          {quote.secure_token && (
            <p className="text-xs text-muted">
              Lien de consultation client :{" "}
              <span className="font-mono text-ink">
                {`${process.env.NEXT_PUBLIC_APP_URL}/devis/${quote.secure_token}`}
              </span>
            </p>
          )}
        </CardBody>
      </Card>

      {files && files.length > 0 && (
        <Card>
          <CardHeader>
            <p className="font-display text-lg text-ink">Pièces jointes</p>
          </CardHeader>
          <CardBody>
            <ul className="flex flex-col gap-2">
              {files.map((file) => {
                const signedUrl = signedUrlByPath.get(file.file_url);
                return (
                  <li key={file.id} className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-ink">{file.label ?? "Document"}</span>
                      <Badge tone={RESELLER_FILE_TYPE_TONE[file.type]}>{RESELLER_FILE_TYPE_LABEL[file.type]}</Badge>
                    </span>
                    {signedUrl ? (
                      <a href={signedUrl} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                        Télécharger
                      </a>
                    ) : (
                      <span className="text-sm text-muted">Indisponible</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
