import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Id de la fiche `resellers` liée au compte revendeur actuellement connecté.
// Toutes les requêtes de l'espace revendeur doivent filtrer sur cet id
// (en complément des RLS, qui l'imposent déjà côté base).
export async function getCurrentResellerId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("resellers").select("id").eq("user_id", user.id).single();
  return data?.id ?? null;
}
