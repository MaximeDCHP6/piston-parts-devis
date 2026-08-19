import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { QuoteForm } from "../../QuoteForm";
import { updateQuote } from "../../actions";
import { buildPriceHistory } from "../../priceHistory";
import type { EditableLine } from "../../QuoteLinesEditor";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).single();
  if (!quote) notFound();

  const [{ data: lines }, { data: resellers }, { data: products }, { data: clientContacts }, priceHistory] =
    await Promise.all([
      supabase.from("quote_lines").select("*").eq("quote_id", id).order("line_order", { ascending: true }),
      supabase.from("resellers").select("*").order("company_name", { ascending: true }),
      supabase.from("products").select("*").order("name", { ascending: true }),
      supabase.from("client_contacts").select("*").order("name", { ascending: true }),
      buildPriceHistory(supabase),
    ]);

  const lineIds = (lines ?? []).map((l) => l.id);
  const { data: costs } =
    lineIds.length > 0
      ? await supabase.from("quote_line_costs").select("*").in("quote_line_id", lineIds)
      : { data: [] as { quote_line_id: string; cost_price: number }[] };
  const costByLineId = new Map((costs ?? []).map((c) => [c.quote_line_id, c.cost_price]));

  const initialLines: EditableLine[] = (lines ?? []).map((line) => ({
    key: line.id,
    product_id: line.product_id,
    description: line.description,
    quantity: line.quantity,
    cost_price: costByLineId.get(line.id) ?? 0,
    unit_price: line.unit_price,
    discount_percent: line.discount_percent,
    vat_rate: line.vat_rate,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Modifier le devis" description={quote.client_name ?? undefined} />
      <QuoteForm
        action={updateQuote.bind(null, id)}
        resellers={resellers ?? []}
        products={products ?? []}
        clientContacts={clientContacts ?? []}
        priceHistory={priceHistory}
        initialQuote={quote}
        initialLines={initialLines}
      />
    </div>
  );
}
