"use server";

import { z } from "zod";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isResellerFileType } from "@/lib/status";
import { getCurrentUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { sanitizeFilename } from "@/lib/storage";
import type { QuoteStatus, Product } from "@/lib/types/database";

const LineSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, "Description requise."),
  quantity: z.coerce.number().positive(),
  cost_price: z.coerce.number().min(0),
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
  client_address: z.string().trim().optional(),
  vehicle_registration: z.string().trim().optional(),
  order_number: z.string().trim().optional(),
  quote_number: z.string().trim().optional(),
  valid_until: z.string().optional(),
  quote_date: z.string().optional(),
  lines: LinesJsonSchema,
});

export interface QuoteFormState {
  error: string | null;
}

function parseQuote(formData: FormData) {
  return QuoteSchema.safeParse({
    reseller_id: formData.get("reseller_id"),
    client_name: formData.get("client_name"),
    client_email: formData.get("client_email"),
    client_address: formData.get("client_address"),
    vehicle_registration: formData.get("vehicle_registration"),
    order_number: formData.get("order_number"),
    quote_number: formData.get("quote_number"),
    valid_until: formData.get("valid_until"),
    quote_date: formData.get("quote_date"),
    lines: formData.get("lines"),
  });
}

// Un devis créé pour une date passée (saisie rétroactive) doit garder cette
// date en `created_at`, sinon il apparaîtrait daté d'aujourd'hui dans les
// listes et filtres. Midi évite tout décalage de jour lié au fuseau horaire.
function resolveQuoteDate(quoteDate: string | undefined) {
  if (!quoteDate) return undefined;
  const parsed = new Date(`${quoteDate}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

// Enregistre l'adresse du client dans le carnet du revendeur si elle n'y
// figure pas déjà (aucune étape manuelle requise côté admin).
async function rememberClientContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  resellerId: string,
  name: string,
  email: string | null,
  address: string | null,
) {
  if (!name || !address) return;

  const { data: existing } = await supabase
    .from("client_contacts")
    .select("id")
    .eq("reseller_id", resellerId)
    .eq("name", name)
    .eq("address", address)
    .maybeSingle();

  if (!existing) {
    await supabase.from("client_contacts").insert({
      reseller_id: resellerId,
      name,
      email: email || null,
      address,
    });
  }
}

export async function createQuote(
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const parsed = parseQuote(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const secureToken = nanoid(32);

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      reseller_id: parsed.data.reseller_id,
      type: "to_client",
      status: "draft",
      client_name: parsed.data.client_name || null,
      client_email: parsed.data.client_email || null,
      client_address: parsed.data.client_address || null,
      vehicle_registration: parsed.data.vehicle_registration || null,
      order_number: parsed.data.order_number || null,
      quote_number: parsed.data.quote_number || null,
      valid_until: parsed.data.valid_until || null,
      secure_token: secureToken,
      created_at: resolveQuoteDate(parsed.data.quote_date),
    })
    .select("id")
    .single();

  if (error || !quote) return { error: error?.message ?? "Échec de la création du devis." };

  const { data: insertedLines, error: linesError } = await supabase
    .from("quote_lines")
    .insert(
      parsed.data.lines.map((line, index) => ({
        quote_id: quote.id,
        product_id: line.product_id || null,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        vat_rate: line.vat_rate,
        line_order: index,
      })),
    )
    .select("id");

  if (linesError || !insertedLines) return { error: linesError?.message ?? "Échec de l'ajout des lignes." };

  const costs = insertedLines.map((line, index) => ({
    quote_line_id: line.id,
    cost_price: parsed.data.lines[index].cost_price,
  }));
  await supabase.from("quote_line_costs").insert(costs);

  await rememberClientContact(
    supabase,
    parsed.data.reseller_id,
    parsed.data.client_name || "",
    parsed.data.client_email || null,
    parsed.data.client_address || null,
  );

  const currentUser = await getCurrentUser();
  await logAction(supabase, currentUser?.id, "quote.created", "quote", quote.id);

  revalidatePath("/admin/quotes");
  redirect(`/admin/quotes/${quote.id}`);
}

export async function updateQuote(
  quoteId: string,
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const parsed = parseQuote(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("quotes")
    .update({
      reseller_id: parsed.data.reseller_id,
      client_name: parsed.data.client_name || null,
      client_email: parsed.data.client_email || null,
      client_address: parsed.data.client_address || null,
      vehicle_registration: parsed.data.vehicle_registration || null,
      order_number: parsed.data.order_number || null,
      quote_number: parsed.data.quote_number || null,
      valid_until: parsed.data.valid_until || null,
      ...(parsed.data.quote_date ? { created_at: resolveQuoteDate(parsed.data.quote_date) } : {}),
    })
    .eq("id", quoteId);

  if (error) return { error: error.message };

  // Remplace les lignes existantes par la version soumise (plus simple et
  // plus sûr qu'un diff ligne à ligne pour un formulaire d'édition complet).
  const { data: oldLines } = await supabase.from("quote_lines").select("id").eq("quote_id", quoteId);
  if (oldLines && oldLines.length > 0) {
    await supabase
      .from("quote_line_costs")
      .delete()
      .in("quote_line_id", oldLines.map((l) => l.id));
  }
  await supabase.from("quote_lines").delete().eq("quote_id", quoteId);

  const { data: insertedLines, error: linesError } = await supabase
    .from("quote_lines")
    .insert(
      parsed.data.lines.map((line, index) => ({
        quote_id: quoteId,
        product_id: line.product_id || null,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        vat_rate: line.vat_rate,
        line_order: index,
      })),
    )
    .select("id");

  if (linesError || !insertedLines) return { error: linesError?.message ?? "Échec de la mise à jour des lignes." };

  const costs = insertedLines.map((line, index) => ({
    quote_line_id: line.id,
    cost_price: parsed.data.lines[index].cost_price,
  }));
  await supabase.from("quote_line_costs").insert(costs);

  await rememberClientContact(
    supabase,
    parsed.data.reseller_id,
    parsed.data.client_name || "",
    parsed.data.client_email || null,
    parsed.data.client_address || null,
  );

  const currentUser = await getCurrentUser();
  await logAction(supabase, currentUser?.id, "quote.updated", "quote", quoteId);

  revalidatePath(`/admin/quotes/${quoteId}`);
  redirect(`/admin/quotes/${quoteId}`);
}

// Recherche serveur (référence ou nom) utilisée par le champ produit du
// formulaire de devis. Le catalogue compte plusieurs milliers d'articles :
// le charger entièrement côté client puis filtrer en JS ne passait pas à
// l'échelle (payload énorme, et surtout la réponse Postgrest est plafonnée
// à 1000 lignes par défaut, donc la plupart des références restaient
// introuvables). On recherche donc à chaque frappe, côté serveur.
export async function searchProducts(query: string) {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const [{ data: bySku }, { data: byName }] = await Promise.all([
    supabase.from("products").select("*").ilike("sku", `%${q}%`).limit(10),
    supabase.from("products").select("*").ilike("name", `%${q}%`).limit(10),
  ]);

  const merged = new Map<string, Product>();
  for (const p of [...(bySku ?? []), ...(byName ?? [])]) merged.set(p.id, p);
  return Array.from(merged.values()).slice(0, 15);
}

export async function deleteQuote(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  await supabase.from("quotes").delete().eq("id", id);
  await logAction(supabase, currentUser?.id, "quote.deleted", "quote", id);
  revalidatePath("/admin/quotes");
  redirect("/admin/quotes");
}

export async function markQuoteSent(quoteId: string, redirectTo: string) {
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("status", "draft");
  const currentUser = await getCurrentUser();
  await logAction(supabase, currentUser?.id, "quote.sent", "quote", quoteId);
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

const ACTIONABLE_STATUSES: QuoteStatus[] = ["draft", "sent", "viewed"];

// Validation manuelle par l'admin : dans la pratique, personne ne passe par
// le lien public pour accepter — c'est l'admin qui valide lui-même une fois
// l'accord de commande obtenu (téléphone, e-mail...), et ça crée la
// commande liée, comme le ferait le client via le lien.
export async function markQuoteAccepted(quoteId: string, redirectTo: string) {
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("id, reseller_id, status").eq("id", quoteId).single();

  if (quote && ACTIONABLE_STATUSES.includes(quote.status)) {
    await supabase
      .from("quotes")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", quoteId);

    await supabase.from("orders").insert({
      quote_id: quoteId,
      reseller_id: quote.reseller_id,
      status: "preparation",
    });

    const currentUser = await getCurrentUser();
    await logAction(supabase, currentUser?.id, "quote.accepted", "quote", quoteId);
  }

  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function markQuoteRefused(quoteId: string, redirectTo: string) {
  const supabase = await createClient();
  await supabase
    .from("quotes")
    .update({ status: "refused" })
    .eq("id", quoteId)
    .in("status", ACTIONABLE_STATUSES);
  const currentUser = await getCurrentUser();
  await logAction(supabase, currentUser?.id, "quote.refused", "quote", quoteId);
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

// Annule une acceptation faite par erreur : repasse le devis à "envoyé" et
// supprime la commande qui avait été créée automatiquement.
export async function markQuoteUnaccepted(quoteId: string, redirectTo: string) {
  const supabase = await createClient();

  await supabase.from("orders").delete().eq("quote_id", quoteId);
  await supabase
    .from("quotes")
    .update({ status: "sent", accepted_at: null })
    .eq("id", quoteId)
    .eq("status", "accepted");

  const currentUser = await getCurrentUser();
  await logAction(supabase, currentUser?.id, "quote.unaccepted", "quote", quoteId);

  revalidatePath(redirectTo);
  redirect(redirectTo);
}

// Duplique un devis existant (nouvelles lignes/coûts, nouveau token,
// statut "draft"), pour recréer rapidement un devis récurrent sans
// tout ressaisir. Les dates d'envoi/acceptation ne sont jamais copiées.
export async function duplicateQuote(quoteId: string) {
  const supabase = await createClient();

  const { data: original } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  if (!original) redirect("/admin/quotes");

  const { data: lines } = await supabase
    .from("quote_lines")
    .select("*")
    .eq("quote_id", quoteId)
    .order("line_order", { ascending: true });

  const { data: costs } =
    lines && lines.length > 0
      ? await supabase
          .from("quote_line_costs")
          .select("*")
          .in("quote_line_id", lines.map((l) => l.id))
      : { data: [] as { quote_line_id: string; cost_price: number }[] };
  const costByLineId = new Map((costs ?? []).map((c) => [c.quote_line_id, c.cost_price]));

  const { data: newQuote, error } = await supabase
    .from("quotes")
    .insert({
      reseller_id: original.reseller_id,
      type: "to_client",
      status: "draft",
      client_name: original.client_name,
      client_email: original.client_email,
      client_address: original.client_address,
      vehicle_registration: original.vehicle_registration,
      order_number: null,
      quote_number: null,
      valid_until: null,
      secure_token: nanoid(32),
    })
    .select("id")
    .single();

  if (error || !newQuote) redirect(`/admin/quotes/${quoteId}`);

  if (lines && lines.length > 0) {
    const { data: insertedLines } = await supabase
      .from("quote_lines")
      .insert(
        lines.map((line, index) => ({
          quote_id: newQuote.id,
          product_id: line.product_id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          vat_rate: line.vat_rate,
          line_order: index,
        })),
      )
      .select("id");

    if (insertedLines) {
      await supabase.from("quote_line_costs").insert(
        insertedLines.map((line, index) => ({
          quote_line_id: line.id,
          cost_price: costByLineId.get(lines[index].id) ?? 0,
        })),
      );
    }
  }

  const currentUser = await getCurrentUser();
  await logAction(supabase, currentUser?.id, "quote.duplicated", "quote", newQuote.id, { source_quote_id: quoteId });

  revalidatePath("/admin/quotes");
  redirect(`/admin/quotes/${newQuote.id}/edit`);
}

export interface QuoteNoteState {
  error: string | null;
}

export async function saveQuoteNote(
  quoteId: string,
  _prevState: QuoteNoteState,
  formData: FormData,
): Promise<QuoteNoteState> {
  const note = String(formData.get("note") ?? "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("quote_notes")
    .upsert({ quote_id: quoteId, note, updated_at: new Date().toISOString() });

  if (error) return { error: error.message };

  revalidatePath(`/admin/quotes/${quoteId}`);
  return { error: null };
}

export interface UploadQuoteFileState {
  error: string | null;
}

// Pièce jointe ERP (le vrai devis/facture fournisseur, émis en dehors de
// l'application) : visible du revendeur sur ce devis précis, jamais sur la
// page publique /devis/[token] consultée par le client final.
export async function uploadQuoteFile(
  quoteId: string,
  resellerId: string,
  _prevState: UploadQuoteFileState,
  formData: FormData,
): Promise<UploadQuoteFileState> {
  const file = formData.get("file");
  const label = String(formData.get("label") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "other");
  const type = isResellerFileType(typeRaw) ? typeRaw : "other";

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier." };
  }

  const supabase = await createClient();
  const path = `${resellerId}/quote-${quoteId}/${Date.now()}-${sanitizeFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage.from("reseller-files").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("reseller_files").insert({
    reseller_id: resellerId,
    quote_id: quoteId,
    type,
    file_url: path,
    label: label || file.name,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/quotes/${quoteId}`);
  redirect(`/admin/quotes/${quoteId}`);
}

export async function deleteQuoteFile(formData: FormData) {
  const id = String(formData.get("id"));
  const quoteId = String(formData.get("quoteId"));
  const path = String(formData.get("path"));

  const supabase = await createClient();
  await supabase.storage.from("reseller-files").remove([path]);
  await supabase.from("reseller_files").delete().eq("id", id);

  revalidatePath(`/admin/quotes/${quoteId}`);
}
