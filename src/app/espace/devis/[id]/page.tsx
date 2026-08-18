import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { QuoteLinesTable } from "@/components/quotes/QuoteLinesTable";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResellerId } from "@/lib/reseller";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from "@/lib/status";
import type { QuoteStatus, QuoteType } from "@/lib/types/database";

const TYPE_LABEL: Record<QuoteType, string> = {
  to_reseller: "Devis fournisseur",
  to_client: "Devis client final",
};

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

  const { data: lines } = await supabase
    .from("quote_lines")
    .select("*")
    .eq("quote_id", id)
    .order("line_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={TYPE_LABEL[quote.type as QuoteType]}
        description={quote.client_name ? `Client final : ${quote.client_name}` : undefined}
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

          {quote.type === "to_client" && quote.secure_token && (
            <p className="text-xs text-muted">
              Lien de consultation client :{" "}
              <span className="font-mono text-ink">
                {`${process.env.NEXT_PUBLIC_APP_URL}/devis/${quote.secure_token}`}
              </span>
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
