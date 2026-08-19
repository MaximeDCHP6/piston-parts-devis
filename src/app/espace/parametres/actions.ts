"use server";

import { createClient } from "@/lib/supabase/server";

export interface PasswordFormState {
  error: string | null;
  success: boolean;
}

export async function changePassword(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères.", success: false };
  }
  if (password !== confirm) {
    return { error: "Les mots de passe ne correspondent pas.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message, success: false };

  return { error: null, success: true };
}
