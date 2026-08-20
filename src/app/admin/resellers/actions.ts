"use server";

import { z } from "zod";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const ResellerSchema = z.object({
  company_name: z.string().trim().min(1, "Le nom du revendeur est requis."),
  contact_email: z.string().trim().email("E-mail invalide.").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  siret: z.string().trim().optional(),
  vat_intra: z.string().trim().optional(),
  margin_percent: z.string().transform((v) => Number(v) || 0),
  primary_color: z.string().trim().optional(),
  secondary_color: z.string().trim().optional(),
  legal_mentions: z.string().trim().optional(),
  signature_text: z.string().trim().optional(),
});

export interface ResellerFormState {
  error: string | null;
}

function parseReseller(formData: FormData) {
  return ResellerSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_email: formData.get("contact_email"),
    phone: formData.get("phone"),
    siret: formData.get("siret"),
    vat_intra: formData.get("vat_intra"),
    margin_percent: formData.get("margin_percent"),
    primary_color: formData.get("primary_color"),
    secondary_color: formData.get("secondary_color"),
    legal_mentions: formData.get("legal_mentions"),
    signature_text: formData.get("signature_text"),
  });
}

async function uploadLogoIfPresent(resellerId: string, formData: FormData) {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return null;

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${resellerId}/logo-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("reseller-logos").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) return null;

  const { data } = supabase.storage.from("reseller-logos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createReseller(
  _prevState: ResellerFormState,
  formData: FormData,
): Promise<ResellerFormState> {
  const parsed = parseReseller(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { data: reseller, error } = await supabase
    .from("resellers")
    .insert({
      company_name: parsed.data.company_name,
      contact_email: parsed.data.contact_email || null,
      phone: parsed.data.phone || null,
      siret: parsed.data.siret || null,
      vat_intra: parsed.data.vat_intra || null,
      margin_percent: parsed.data.margin_percent,
      primary_color: parsed.data.primary_color || "#1a1a1a",
      secondary_color: parsed.data.secondary_color || "#6b6b6b",
      legal_mentions: parsed.data.legal_mentions || null,
      signature_text: parsed.data.signature_text || null,
    })
    .select("id")
    .single();

  if (error || !reseller) return { error: error?.message ?? "Échec de la création." };

  const logoUrl = await uploadLogoIfPresent(reseller.id, formData);
  if (logoUrl) {
    await supabase.from("resellers").update({ logo_url: logoUrl }).eq("id", reseller.id);
  }

  const currentUser = await getCurrentUser();
  await logAction(supabase, currentUser?.id, "reseller.created", "reseller", reseller.id);

  revalidatePath("/admin/resellers");
  redirect(`/admin/resellers/${reseller.id}`);
}

export async function updateReseller(
  id: string,
  _prevState: ResellerFormState,
  formData: FormData,
): Promise<ResellerFormState> {
  const parsed = parseReseller(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const logoUrl = await uploadLogoIfPresent(id, formData);

  const { error } = await supabase
    .from("resellers")
    .update({
      company_name: parsed.data.company_name,
      contact_email: parsed.data.contact_email || null,
      phone: parsed.data.phone || null,
      siret: parsed.data.siret || null,
      vat_intra: parsed.data.vat_intra || null,
      margin_percent: parsed.data.margin_percent,
      primary_color: parsed.data.primary_color || "#1a1a1a",
      secondary_color: parsed.data.secondary_color || "#6b6b6b",
      legal_mentions: parsed.data.legal_mentions || null,
      signature_text: parsed.data.signature_text || null,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/resellers");
  revalidatePath(`/admin/resellers/${id}`);
  return { error: null };
}

export async function deleteReseller(formData: FormData) {
  const id = String(formData.get("id"));
  const serviceClient = createServiceClient();
  const currentUser = await getCurrentUser();

  const { data: reseller } = await serviceClient.from("resellers").select("user_id").eq("id", id).single();
  if (reseller?.user_id) {
    await serviceClient.auth.admin.deleteUser(reseller.user_id);
  }

  await serviceClient.from("resellers").delete().eq("id", id);
  await logAction(serviceClient, currentUser?.id, "reseller.deleted", "reseller", id);

  revalidatePath("/admin/resellers");
  redirect("/admin/resellers");
}

export interface CreateLoginState {
  error: string | null;
  password: string | null;
}

// Crée un compte de connexion Supabase pour le revendeur. Le mot de passe
// généré est affiché une seule fois à l'admin, à communiquer au revendeur
// par ses propres moyens (aucun envoi d'e-mail automatique, cf. choix produit).
export async function createResellerLogin(
  resellerId: string,
  _prevState: CreateLoginState,
  formData: FormData,
): Promise<CreateLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "E-mail requis.", password: null };

  const password = nanoid(14);
  const serviceClient = createServiceClient();

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Échec de la création du compte.", password: null };
  }

  await serviceClient
    .from("profiles")
    .update({ role: "revendeur" })
    .eq("id", created.user.id);

  const { error: linkError } = await serviceClient
    .from("resellers")
    .update({ user_id: created.user.id })
    .eq("id", resellerId);

  if (linkError) return { error: linkError.message, password: null };

  const currentUser = await getCurrentUser();
  await logAction(serviceClient, currentUser?.id, "reseller.login_created", "reseller", resellerId);

  revalidatePath(`/admin/resellers/${resellerId}`);
  return { error: null, password };
}

export interface ResetPasswordState {
  error: string | null;
  password: string | null;
}

// Réinitialise le mot de passe d'un revendeur déjà connecté. Même logique
// que la création initiale : affiché une seule fois, à communiquer par
// l'admin lui-même.
export async function resetResellerPassword(
  resellerId: string,
  _prevState: ResetPasswordState,
  _formData: FormData,
): Promise<ResetPasswordState> {
  const serviceClient = createServiceClient();

  const { data: reseller } = await serviceClient
    .from("resellers")
    .select("user_id")
    .eq("id", resellerId)
    .single();

  if (!reseller?.user_id) return { error: "Ce revendeur n'a pas encore de compte.", password: null };

  const password = nanoid(14);
  const { error } = await serviceClient.auth.admin.updateUserById(reseller.user_id, { password });
  if (error) return { error: error.message, password: null };

  const currentUser = await getCurrentUser();
  await logAction(serviceClient, currentUser?.id, "reseller.password_reset", "reseller", resellerId);

  return { error: null, password };
}
