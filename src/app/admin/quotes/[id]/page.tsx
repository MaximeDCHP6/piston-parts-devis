import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { QuoteLinesTable } from "@/components/quotes/QuoteLinesTable";
import { QuoteSendActions } from "@/components/quotes/QuoteSendActions";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from "@/lib/status";
import { generateClientQuote, markQuoteSent } from "../actions";
import type { QuoteStatus } from "@/lib/types/database";

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ genError?: string }>;
}) {
  const { id } = await params;
  const { genError } = await searchParams;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("type", "to_reseller")
    .single();

  if (!quote) notFound();

  const [{ data: lines }, { data: clientQuote }, { data: reseller }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", id).order("line_order", { ascending: true }),
    supabase.from("quotes").select("*").eq("parent_quote_id", id).eq("type", "to_client").maybeSingle(),
    supabase.from("resellers").select("company_name, signature_text").eq("id", quote.reseller_id).single(),
  ]);

  const resellerName = reseller?.company_name ?? "—";

  const clientLines = clientQuote
    ? (await supabase.from("quote_lines").select("*").eq("quote_id", clientQuote.id).order("line_order", { ascending: true })).data
    : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Devis — ${resellerName}`}
        description={quote.client_name ? `Client final : ${quote.client_name}` : undefined}
        actions={<Badge tone={QUOTE_STATUS_TONE[quote.status as QuoteStatus]}>{QUOTE_STATUS_LABEL[quote.status as QuoteStatus]}</Badge>}
      />

      {genError && (
        <p className="rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{genError}</p>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-display text-lg text-ink">Devis revendeur</p>
          <ButtonLink href={`/api/quotes/${id}/pdf`} variant="secondary" size="sm">
            Télécharger le PDF
          </ButtonLink>
        </CardHeader>
        <CardBody>{lines && lines.length > 0 ? <QuoteLinesTable lines={lines} /> : <p className="text-sm text-muted">Aucune ligne.</p>}</CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Devis client final</p>
        </CardHeader>
        <CardBody>
          {!clientQuote ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted">
                Aucun devis n&apos;a encore été généré pour le client final. La marge du revendeur sera appliquée
                automatiquement à chaque ligne.
              </p>
              <form action={generateClientQuote.bind(null, id)}>
                <Button type="submit">Générer le devis client</Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Badge tone={QUOTE_STATUS_TONE[clientQuote.status as QuoteStatus]}>
                  {QUOTE_STATUS_LABEL[clientQuote.status as QuoteStatus]}
                </Badge>
                <p className="text-sm text-muted">{clientQuote.client_name}</p>
              </div>
              {clientLines && clientLines.length > 0 ? (
                <QuoteLinesTable lines={clientLines} />
              ) : (
                <p className="text-sm text-muted">Aucune ligne.</p>
              )}
              <QuoteSendActions
                quoteId={clientQuote.id}
                clientName={clientQuote.client_name}
                clientEmail={clientQuote.client_email}
                resellerCompanyName={resellerName}
                resellerSignature={reseller?.signature_text}
                showMarkSent={clientQuote.status === "draft"}
                markSentAction={markQuoteSent.bind(null, clientQuote.id, `/admin/quotes/${id}`)}
              />
              {clientQuote.secure_token && (
                <p className="text-xs text-muted">
                  Lien de consultation client :{" "}
                  <span className="font-mono text-ink">
                    {`${process.env.NEXT_PUBLIC_APP_URL}/devis/${clientQuote.secure_token}`}
                  </span>
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
