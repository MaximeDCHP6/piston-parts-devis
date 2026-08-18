"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

const ACTIONABLE_STATUSES = ["draft", "sent", "viewed"];

export async function acceptQuote(token: string) {
  const supabase = createServiceClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, reseller_id, status")
    .eq("secure_token", token)
    .eq("type", "to_client")
    .single();

  if (quote && ACTIONABLE_STATUSES.includes(quote.status)) {
    await supabase
      .from("quotes")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", quote.id);

    await supabase.from("orders").insert({
      quote_id: quote.id,
      reseller_id: quote.reseller_id,
      status: "preparation",
    });
  }

  redirect(`/devis/${token}`);
}

export async function refuseQuote(token: string) {
  const supabase = createServiceClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("secure_token", token)
    .eq("type", "to_client")
    .single();

  if (quote && ACTIONABLE_STATUSES.includes(quote.status)) {
    await supabase.from("quotes").update({ status: "refused" }).eq("id", quote.id);
  }

  redirect(`/devis/${token}`);
}
