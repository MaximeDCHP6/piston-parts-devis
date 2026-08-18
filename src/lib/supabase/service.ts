import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Client "service role" : contourne totalement les RLS. Réservé aux
// routes serveur qui doivent lire/écrire en dehors du contexte d'un
// utilisateur authentifié (ex. page publique /devis/[token] consultée par
// le client final, qui n'a pas de compte Supabase).
// Ne jamais importer ce fichier depuis du code exécuté côté navigateur.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
