import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { QuoteLinesTable } from "@/components/quotes/QuoteLinesTable";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, RESELLER_FILE_TYPE_LABEL, RESELLER_FILE_TYPE_TONE } from "@/lib/status";
import type { OrderStatus } from "@/lib/types/database";

export default async function EspaceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resellerId = await getCurrentResellerId();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("reseller_id", resellerId ?? "")
    .single();

  if (!order) notFound();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", order.quote_id).single();
  if (!quote) notFound();

  const [{ data: lines }, { data: files }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", quote.id).order("line_order", { ascending: true }),
    supabase.from("reseller_files").select("*").eq("quote_id", quote.id).order("uploaded_at", { ascending: false }),
  ]);

  const lineIds = (lines ?? []).map((l) => l.id);
  const { data: costs } =
    lineIds.length > 0
      ? await supabase.from("quote_line_costs").select("*").in("quote_line_id", lineIds)
      : { data: [] as { quote_line_id: string; cost_price: number }[] };
  const costByLineId = new Map((costs ?? []).map((c) => [c.quote_line_id, c.cost_price]));

  const paths = (files ?? []).map((f) => f.file_url);
  const { data: signedUrls } =
    paths.length > 0 ? await supabase.storage.from("reseller-files").createSignedUrls(paths, 300) : { data: [] };
  const signedUrlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  const invoices = (files ?? []).filter((f) => f.type === "invoice");
  const otherFiles = (files ?? []).filter((f) => f.type !== "invoice");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={quote.client_name ?? "Commande"}
        description={`Commande du ${new Date(order.created_at).toLocaleDateString("fr-FR")}${quote.order_number ? ` · N° commande : ${quote.order_number}` : ""}`}
        actions={<Badge tone={ORDER_STATUS_TONE[order.status as OrderStatus]}>{ORDER_STATUS_LABEL[order.status as OrderStatus]}</Badge>}
      />

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Facture</p>
        </CardHeader>
        <CardBody>
          {invoices.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {invoices.map((file) => {
                const signedUrl = signedUrlByPath.get(file.file_url);
                return (
                  <li
                    key={file.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm"
                  >
                    <span className="text-ink">{file.label ?? "Facture"}</span>
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
          ) : (
            <p className="text-sm text-muted">Aucune facture jointe pour l&apos;instant sur cette commande.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-display text-lg text-ink">Détail du devis</p>
          <ButtonLink href={`/api/quotes/${quote.id}/pdf`} variant="secondary" size="sm">
            Télécharger le PDF
          </ButtonLink>
        </CardHeader>
        <CardBody>
          {lines && lines.length > 0 ? (
            <QuoteLinesTable lines={lines} costByLineId={costByLineId} />
          ) : (
            <p className="text-sm text-muted">Aucune ligne.</p>
          )}
        </CardBody>
      </Card>

      {otherFiles.length > 0 && (
        <Card>
          <CardHeader>
            <p className="font-display text-lg text-ink">Autres documents</p>
          </CardHeader>
          <CardBody>
            <ul className="flex flex-col gap-2">
              {otherFiles.map((file) => {
                const signedUrl = signedUrlByPath.get(file.file_url);
                return (
                  <li key={file.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm">
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
