import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { QuotePdf, splitLines } from "@/lib/pdf/QuotePdf";

export const runtime = "nodejs";

// Génération à la volée (pas de mise en cache dans Storage) : le PDF
// reflète toujours l'état courant du devis. L'accès est protégé par les
// RLS Supabase (admin = tout, revendeur = ses propres devis uniquement).
// L'application ne produit que des devis pour le client final : l'émetteur
// est donc toujours la marque blanche du revendeur.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).single();
  if (!quote) return new Response("Devis introuvable.", { status: 404 });

  const [{ data: lines }, { data: reseller }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", id).order("line_order", { ascending: true }),
    supabase.from("resellers").select("*").eq("id", quote.reseller_id).single(),
  ]);

  const buffer = await renderToBuffer(
    <QuotePdf
      documentTitle="Devis"
      issuer={{
        name: reseller?.company_name ?? "",
        logoUrl: reseller?.logo_url,
        addressLines: splitLines(reseller?.legal_mentions),
        phone: reseller?.phone,
        email: reseller?.contact_email,
        siret: reseller?.siret,
        vatIntra: reseller?.vat_intra,
      }}
      recipient={{
        name: quote.client_name,
        addressLines: splitLines(quote.client_address),
      }}
      quoteRef={quote.quote_number || quote.id.slice(0, 8).toUpperCase()}
      createdAt={quote.created_at}
      vehicleRegistration={quote.vehicle_registration}
      orderNumber={quote.order_number}
      footerContact={reseller?.contact_email ?? reseller?.signature_text ?? null}
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
