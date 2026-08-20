import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { QuoteForm } from "../QuoteForm";
import { createQuote } from "../actions";
import { buildPriceHistory } from "../priceHistory";

export default async function NewQuotePage() {
  const supabase = await createClient();
  const [{ data: resellers }, { data: clientContacts }, priceHistory] = await Promise.all([
    supabase.from("resellers").select("*").order("company_name", { ascending: true }),
    supabase.from("client_contacts").select("*").order("name", { ascending: true }),
    buildPriceHistory(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau devis" description="Devis établi pour le client final d'un revendeur." />
      <QuoteForm
        action={createQuote}
        resellers={resellers ?? []}
        clientContacts={clientContacts ?? []}
        priceHistory={priceHistory}
      />
    </div>
  );
}
