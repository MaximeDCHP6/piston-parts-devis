"use server";

import { z } from "zod";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyMargin } from "@/lib/quote-calc";

const LineSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, "Description requise."),
  quantity: z.coerce.number().positive(),
  unit_price: z.coerce.number().min(0),
  discount_percent: z.coerce.number().min(0).max(100),
  vat_rate: z.coerce.number().min(0),
});

const LinesJsonSchema = z.string().transform((value, ctx) => {
  try {
    const parsed = JSON.parse(value);
    const result = z.array(LineSchema).min(1, "Ajoutez au moins une ligne.").safeParse(parsed);
    if (!result.success) {
      ctx.addIssue({ code: "custom", message: "Lignes de devis invalides." });
      return z.NEVER;
    }
    return result.data;
  } catch {
    ctx.addIssue({ code: "custom", message: "Lignes de devis invalides." });
    return z.NEVER;
  }
});

const QuoteSchema = z.object({
  reseller_id: z.string().uuid("Sélectionnez un revendeur."),
  client_name: z.string().trim().optional(),
  client_email: z.string().trim().email("E-mail client invalide.").optional().or(z.literal("")),
  valid_until: z.string().optional(),
  lines: LinesJsonSchema,
});

export interface QuoteFormState {
  error: string | null;
}

export async function createQuote(
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const parsed = QuoteSchema.safeParse({
    reseller_id: formData.get("reseller_id"),
    client_name: formData.get("client_name"),
    client_email: formData.get("client_email"),
    valid_until: formData.get("valid_until"),
    lines: formData.get("lines"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      reseller_id: parsed.data.reseller_id,
      type: "to_reseller",
      status: "draft",
      client_name: parsed.data.client_name || null,
      client_email: parsed.data.client_email || null,
      valid_until: parsed.data.valid_until || null,
    })
    .select("id")
    .single();

  if (error || !quote) return { error: error?.message ?? "Échec de la création du devis." };

  const linesToInsert = parsed.data.lines.map((line, index) => ({
    quote_id: quote.id,
    product_id: line.product_id || null,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unit_price,
    discount_percent: line.discount_percent,
    vat_rate: line.vat_rate,
    line_order: index,
  }));

  const { error: linesError } = await supabase.from("quote_lines").insert(linesToInsert);
  if (linesError) return { error: linesError.message };

  revalidatePath("/admin/quotes");
  redirect(`/admin/quotes/${quote.id}`);
}

export async function deleteQuote(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("quotes").delete().eq("id", id);
  revalidatePath("/admin/quotes");
}

// Génère automatiquement le devis miroir destiné au client final : copie
// des lignes du devis revendeur avec la marge du revendeur appliquée.
export async function generateClientQuote(resellerQuoteId: string) {
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", resellerQuoteId)
    .eq("type", "to_reseller")
    .single();

  if (!quote) redirect(`/admin/quotes/${resellerQuoteId}?genError=Devis introuvable.`);

  if (!quote.client_name || !quote.client_email) {
    redirect(
      `/admin/quotes/${resellerQuoteId}?genError=${encodeURIComponent(
        "Renseignez le nom et l'e-mail du client final avant de générer le devis miroir.",
      )}`,
    );
  }

  const [{ data: lines }, { data: reseller }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", resellerQuoteId).order("line_order", { ascending: true }),
    supabase.from("resellers").select("margin_percent").eq("id", quote.reseller_id).single(),
  ]);

  const marginPercent = reseller?.margin_percent ?? 0;

  const secureToken = nanoid(32);

  const { data: clientQuote, error } = await supabase
    .from("quotes")
    .insert({
      reseller_id: quote.reseller_id,
      type: "to_client",
      parent_quote_id: quote.id,
      status: "draft",
      client_name: quote.client_name,
      client_email: quote.client_email,
      valid_until: quote.valid_until,
      secure_token: secureToken,
    })
    .select("id")
    .single();

  if (error || !clientQuote) {
    redirect(`/admin/quotes/${resellerQuoteId}?genError=${encodeURIComponent(error?.message ?? "Échec de la génération.")}`);
  }

  const clientLines = (lines ?? []).map((line, index) => ({
    quote_id: clientQuote.id,
    product_id: line.product_id,
    description: line.description,
    quantity: line.quantity,
    unit_price: applyMargin(line.unit_price, marginPercent),
    discount_percent: line.discount_percent,
    vat_rate: line.vat_rate,
    line_order: index,
  }));

  if (clientLines.length > 0) {
    await supabase.from("quote_lines").insert(clientLines);
  }

  revalidatePath(`/admin/quotes/${resellerQuoteId}`);
  redirect(`/admin/quotes/${resellerQuoteId}`);
}

export async function markQuoteSent(quoteId: string, redirectTo: string) {
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("status", "draft");
  revalidatePath(redirectTo);
  redirect(redirectTo);
}
