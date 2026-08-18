import { notFound } from "next/navigation";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/service";
import { QuoteLinesTable } from "@/components/quotes/QuoteLinesTable";
import { Button } from "@/components/ui/Button";
import { acceptQuote, refuseQuote } from "./actions";
import type { QuoteStatus } from "@/lib/types/database";

const ACTIONABLE_STATUSES: QuoteStatus[] = ["draft", "sent", "viewed"];

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("secure_token", token)
    .eq("type", "to_client")
    .maybeSingle();

  if (!quote) notFound();

  let status: QuoteStatus = quote.status;

  const isPastValidity = quote.valid_until ? new Date(quote.valid_until) < new Date() : false;

  if (isPastValidity && ACTIONABLE_STATUSES.includes(status)) {
    await supabase.from("quotes").update({ status: "expired" }).eq("id", quote.id);
    status = "expired";
  } else if (!quote.viewed_at && (status === "draft" || status === "sent")) {
    await supabase
      .from("quotes")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", quote.id);
    status = "viewed";
  }

  const [{ data: lines }, { data: reseller }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", quote.id).order("line_order", { ascending: true }),
    supabase.from("resellers").select("*").eq("id", quote.reseller_id).single(),
  ]);

  const canAct = ACTIONABLE_STATUSES.includes(status);
  const accentColor = reseller?.primary_color || undefined;

  return (
    <main className="min-h-screen bg-paper px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          {reseller?.logo_url ? (
            <Image
              src={reseller.logo_url}
              alt={reseller.company_name}
              width={160}
              height={56}
              unoptimized
              className="h-12 w-auto object-contain"
            />
          ) : (
            <p className="font-display text-xl text-ink">{reseller?.company_name}</p>
          )}
        </header>

        <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs uppercase tracking-wide text-muted">Devis pour {quote.client_name}</p>
          <h1 className="mt-1 font-display text-2xl text-ink">Votre devis</h1>
          {quote.valid_until && (
            <p className="mt-1 text-sm text-muted">
              Valable jusqu&apos;au {new Date(quote.valid_until).toLocaleDateString("fr-FR")}
            </p>
          )}

          <div className="mt-6">
            {lines && lines.length > 0 ? (
              <QuoteLinesTable lines={lines} />
            ) : (
              <p className="text-sm text-muted">Aucune ligne.</p>
            )}
          </div>

          {status === "accepted" && (
            <p className="mt-6 rounded-sm bg-success/10 px-4 py-3 text-sm text-success">
              Merci, vous avez accepté ce devis. {reseller?.company_name} reviendra vers vous rapidement.
            </p>
          )}
          {status === "refused" && (
            <p className="mt-6 rounded-sm bg-danger/10 px-4 py-3 text-sm text-danger">
              Vous avez refusé ce devis.
            </p>
          )}
          {status === "expired" && (
            <p className="mt-6 rounded-sm bg-warning/10 px-4 py-3 text-sm text-warning">
              Ce devis a expiré. Contactez {reseller?.company_name} pour obtenir une nouvelle proposition.
            </p>
          )}

          {canAct && (
            <div className="mt-8 flex flex-wrap gap-3">
              <form action={acceptQuote.bind(null, token)}>
                <Button type="submit" style={accentColor ? { backgroundColor: accentColor } : undefined}>
                  Accepter le devis
                </Button>
              </form>
              <form action={refuseQuote.bind(null, token)}>
                <Button type="submit" variant="secondary">
                  Refuser
                </Button>
              </form>
            </div>
          )}
        </div>

        {reseller?.legal_mentions && (
          <p className="mt-6 text-center text-xs text-muted">{reseller.legal_mentions}</p>
        )}
      </div>
    </main>
  );
}
