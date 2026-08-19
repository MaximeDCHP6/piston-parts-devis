"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  email: z.string().trim().email("E-mail invalide.").optional().or(z.literal("")),
  address: z.string().trim().optional(),
});

export interface ClientContactFormState {
  error: string | null;
}

export async function createClientContact(
  resellerId: string,
  _prevState: ClientContactFormState,
  formData: FormData,
): Promise<ClientContactFormState> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    address: formData.get("address"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const supabase = await createClient();
  const { error } = await supabase.from("client_contacts").insert({
    reseller_id: resellerId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/resellers/${resellerId}/clients`);
  redirect(`/admin/resellers/${resellerId}/clients`);
}

export async function deleteClientContact(formData: FormData) {
  const id = String(formData.get("id"));
  const resellerId = String(formData.get("resellerId"));
  const supabase = await createClient();
  await supabase.from("client_contacts").delete().eq("id", id);
  revalidatePath(`/admin/resellers/${resellerId}/clients`);
}
