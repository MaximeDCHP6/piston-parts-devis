import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { QuoteLinesTable } from "@/components/quotes/QuoteLinesTable";
import { QuoteSendActions } from "@/components/quotes/QuoteSendActions";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, RESELLER_FILE_TYPE_LABEL, RESELLER_FILE_TYPE_TONE } from "@/lib/status";
import {
  markQuoteSent,
  markQuoteAccepted,
  markQuoteRefused,
  markQuoteUnaccepted,
  uploadQuoteFile,
  deleteQuoteFile,
  deleteQuote,
  duplicateQuote,
  saveQuoteNote,
} from "../actions";
import { QuoteFileUploadForm } from "./QuoteFileUploadForm";
import { QuoteNoteForm } from "./QuoteNoteForm";
import type { QuoteStatus } from "@/lib/types/database";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).single();
  if (!quote) notFound();

  const [{ data: lines }, { data: reseller }, { data: files }, { data: noteRow }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", id).order("line_order", { ascending: true }),
    supabase.from("resellers").select("company_name, signature_text").eq("id", quote.reseller_id).single(),
    supabase.from("reseller_files").select("*").eq("quote_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("quote_notes").select("note").eq("quote_id", id).maybeSingle(),
  ]);

  const resellerName = reseller?.company_name ?? "—";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Devis — ${quote.client_name ?? resellerName}`}
        description={`Revendeur : ${resellerName}${quote.order_number ? ` · N° commande : ${quote.order_number}` : ""}`}
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={QUOTE_STATUS_TONE[quote.status as QuoteStatus]}>{QUOTE_STATUS_LABEL[quote.status as QuoteStatus]}</Badge>
            <form action={duplicateQuote.bind(null, id)}>
              <Button type="submit" variant="secondary" size="sm">
                Dupliquer
              </Button>
            </form>
            <ButtonLink href={`/admin/quotes/${id}/edit`} variant="secondary" size="sm">
              Modifier
            </ButtonLink>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Devis</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {lines && lines.length > 0 ? <QuoteLinesTable lines={lines} /> : <p className="text-sm text-muted">Aucune ligne.</p>}

          <QuoteSendActions
            quoteId={id}
            clientName={quote.client_name}
            clientEmail={quote.client_email}
            resellerCompanyName={resellerName}
            resellerSignature={reseller?.signature_text}
            showMarkSent={quote.status === "draft"}
            markSentAction={markQuoteSent.bind(null, id, `/admin/quotes/${id}`)}
          />

          {quote.secure_token && (
            <p className="text-xs text-muted">
              Lien de consultation client :{" "}
              <span className="font-mono text-ink">
                {`${process.env.NEXT_PUBLIC_APP_URL}/devis/${quote.secure_token}`}
              </span>
            </p>
          )}

          {["draft", "sent", "viewed"].includes(quote.status) && (
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted">Accord obtenu ?</p>
              <form action={markQuoteAccepted.bind(null, id, `/admin/quotes/${id}`)}>
                <Button type="submit" size="sm">
                  Marquer comme accepté
                </Button>
              </form>
              <form action={markQuoteRefused.bind(null, id, `/admin/quotes/${id}`)}>
                <Button type="submit" variant="secondary" size="sm">
                  Marquer comme refusé
                </Button>
              </form>
            </div>
          )}

          {quote.status === "accepted" && (
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted">Accepté par erreur ?</p>
              <form action={markQuoteUnaccepted.bind(null, id, `/admin/quotes/${id}`)}>
                <ConfirmSubmitButton confirmMessage="Annuler l'acceptation de ce devis ? La commande créée automatiquement sera supprimée.">
                  Annuler l&apos;acceptation
                </ConfirmSubmitButton>
              </form>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Pièces jointes ERP</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <p className="text-sm text-muted">Visible du revendeur, jamais du client final.</p>
          <QuoteFileUploadForm action={uploadQuoteFile.bind(null, id, quote.reseller_id)} />
          {files && files.length > 0 && (
            <ul className="flex flex-col gap-2">
              {files.map((file) => (
                <li key={file.id} className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-ink">{file.label ?? "Document"}</span>
                    <Badge tone={RESELLER_FILE_TYPE_TONE[file.type]}>{RESELLER_FILE_TYPE_LABEL[file.type]}</Badge>
                  </span>
                  <form action={deleteQuoteFile}>
                    <input type="hidden" name="id" value={file.id} />
                    <input type="hidden" name="quoteId" value={id} />
                    <input type="hidden" name="path" value={file.file_url} />
                    <ConfirmSubmitButton confirmMessage={`Supprimer "${file.label ?? "ce document"}" ?`}>
                      Supprimer
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Notes internes</p>
        </CardHeader>
        <CardBody>
          <QuoteNoteForm action={saveQuoteNote.bind(null, id)} initialNote={noteRow?.note ?? ""} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-danger">Zone dangereuse</p>
        </CardHeader>
        <CardBody>
          <form action={deleteQuote} className="flex items-center justify-between gap-4">
            <input type="hidden" name="id" value={id} />
            <p className="text-sm text-muted">
              Supprime définitivement ce devis, ses lignes et la commande éventuellement liée.
            </p>
            <ConfirmSubmitButton
              confirmMessage="Supprimer définitivement ce devis ? Cette action est irréversible."
              className="shrink-0"
            >
              Supprimer ce devis
            </ConfirmSubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
