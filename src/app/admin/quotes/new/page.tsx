import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { QuoteForm } from "../QuoteForm";

export default async function NewQuotePage() {
  const supabase = await createClient();
  const [{ data: resellers }, { data: products }] = await Promise.all([
    supabase.from("resellers").select("*").order("company_name", { ascending: true }),
    supabase.from("products").select("*").order("name", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau devis" description="Devis établi pour un revendeur." />
      <QuoteForm resellers={resellers ?? []} products={products ?? []} />
    </div>
  );
}
