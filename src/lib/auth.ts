import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export interface CurrentUser {
  id: string;
  email: string | null;
  profile: Profile;
}

// À utiliser dans les Server Components/layouts protégés. Retourne null si
// aucun utilisateur n'est connecté ou si son profil est introuvable.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { id: user.id, email: user.email ?? null, profile };
}
