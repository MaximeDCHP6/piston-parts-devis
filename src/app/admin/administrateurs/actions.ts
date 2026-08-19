"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUser } from "@/lib/auth";

export interface CreateAdminState {
  error: string | null;
  password: string | null;
}

// Même logique que la création d'un accès revendeur : mot de passe généré,
// affiché une seule fois, à communiquer soi-même (pas d'envoi automatique).
export async function createAdminAccount(
  _prevState: CreateAdminState,
  formData: FormData,
): Promise<CreateAdminState> {
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

  const { error: roleError } = await serviceClient
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", created.user.id);

  if (roleError) return { error: roleError.message, password: null };

  revalidatePath("/admin/administrateurs");
  return { error: null, password };
}

export interface ResetAdminPasswordState {
  error: string | null;
  password: string | null;
}

export async function resetAdminPassword(
  userId: string,
  _prevState: ResetAdminPasswordState,
  _formData: FormData,
): Promise<ResetAdminPasswordState> {
  const serviceClient = createServiceClient();
  const password = nanoid(14);
  const { error } = await serviceClient.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message, password: null };
  return { error: null, password };
}

export interface DeleteAdminState {
  error: string | null;
}

export async function deleteAdminAccount(
  userId: string,
  _prevState: DeleteAdminState,
  _formData: FormData,
): Promise<DeleteAdminState> {
  const currentUser = await getCurrentUser();
  if (currentUser?.id === userId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  const serviceClient = createServiceClient();
  const { data: admins } = await serviceClient.from("profiles").select("id").eq("role", "admin");
  if (!admins || admins.length <= 1) {
    return { error: "Impossible de supprimer le dernier administrateur." };
  }

  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/administrateurs");
  return { error: null };
}
