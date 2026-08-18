import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { QuotePdf } from "@/lib/pdf/QuotePdf";

export const runtime = "nodejs";

// Génération à la volée (pas de mise en cache dans Storage) : le PDF
// reflète toujours l'état courant du devis. L'accès est protégé par les
// RLS Supabase (admin = tout, revendeur = ses propres devis uniquement).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).single();
  if (!quote) return new Response("Devis introuvable.", { status: 404 });

  const [{ data: lines }, { data: reseller }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", id).order("line_order", { ascending: true }),
    supabase.from("resellers").select("*").eq("id", quote.reseller_id).single(),
  ]);

  const issuer =
    quote.type === "to_client"
      ? {
          name: reseller?.company_name ?? "",
          logoUrl: reseller?.logo_url,
          legalMentions: reseller?.legal_mentions,
          signatureText: reseller?.signature_text,
        }
      : {
          name: "Gravelin Parts",
          logoUrl: null,
          legalMentions: "Devis interne — usage réseau de revendeurs.",
          signatureText: null,
        };

  const buffer = await renderToBuffer(
    <QuotePdf
      documentTitle={quote.type === "to_client" ? "Devis" : "Devis revendeur"}
      issuer={issuer}
      recipient={{ name: quote.client_name, email: quote.client_email }}
      quoteRef={quote.id.slice(0, 8).toUpperCase()}
      createdAt={quote.created_at}
      validUntil={quote.valid_until}
      lines={lines ?? []}
    />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="devis-${quote.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
