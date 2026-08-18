export function buildQuoteEmailTemplate({
  clientName,
  resellerCompanyName,
  resellerSignature,
}: {
  clientName?: string | null;
  resellerCompanyName: string;
  resellerSignature?: string | null;
}) {
  const subject = `Votre devis — ${resellerCompanyName}`;
  const body = [
    `Bonjour${clientName ? ` ${clientName}` : ""},`,
    "",
    "Veuillez trouver ci-joint votre devis.",
    "",
    "N'hésitez pas à revenir vers nous pour toute question.",
    "",
    "Cordialement,",
    resellerSignature || resellerCompanyName,
  ].join("\n");

  return { subject, body };
}

export function buildMailtoHref({
  to,
  subject,
  body,
}: {
  to?: string | null;
  subject: string;
  body: string;
}) {
  return `mailto:${encodeURIComponent(to ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
