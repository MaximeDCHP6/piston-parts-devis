"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { buildMailtoHref, buildQuoteEmailTemplate } from "@/lib/mailto";

export function QuoteSendActions({
  quoteId,
  clientName,
  clientEmail,
  resellerCompanyName,
  resellerSignature,
  markSentAction,
  showMarkSent,
}: {
  quoteId: string;
  clientName?: string | null;
  clientEmail?: string | null;
  resellerCompanyName: string;
  resellerSignature?: string | null;
  markSentAction: () => Promise<void>;
  showMarkSent: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { subject, body } = buildQuoteEmailTemplate({
    clientName,
    resellerCompanyName,
    resellerSignature,
  });
  const mailtoHref = buildMailtoHref({ to: clientEmail, subject, body });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">Le lien mailto ne joint pas le PDF — à ajouter manuellement dans Outlook.</p>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href={`/api/quotes/${quoteId}/pdf`} variant="secondary" size="sm">
          Télécharger le PDF
        </ButtonLink>
        <a
          href={mailtoHref}
          className="inline-flex h-8 items-center justify-center rounded-sm bg-ink px-3 text-sm font-medium text-paper hover:bg-accent"
        >
          Ouvrir dans Outlook
        </a>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(`Objet : ${subject}\n\n${body}`);
            setCopied(true);
          }}
          className="text-sm text-accent hover:underline"
        >
          {copied ? "Copié !" : "Copier le texte du mail"}
        </button>
      </div>
      {showMarkSent && (
        <form action={markSentAction}>
          <Button type="submit" variant="ghost" size="sm">
            Marquer comme envoyé
          </Button>
        </form>
      )}
    </div>
  );
}
