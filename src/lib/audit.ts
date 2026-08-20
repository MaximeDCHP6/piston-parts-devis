import "server-only";
import type { createClient } from "@/lib/supabase/server";

// Journal d'activité admin — écriture "best effort" : ne doit jamais faire
// échouer l'action métier qui l'appelle (pas de throw, erreur ignorée).
export async function logAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string | null | undefined,
  action: string,
  entityType?: string,
  entityId?: string | null,
  metadata?: Record<string, unknown>,
) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId ?? null,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata: metadata ?? null,
  });
}

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "quote.created": "Devis créé",
  "quote.updated": "Devis modifié",
  "quote.duplicated": "Devis dupliqué",
  "quote.sent": "Devis marqué envoyé",
  "quote.accepted": "Devis marqué accepté",
  "quote.refused": "Devis marqué refusé",
  "quote.unaccepted": "Acceptation annulée",
  "quote.deleted": "Devis supprimé",
  "reseller.created": "Revendeur créé",
  "reseller.deleted": "Revendeur supprimé",
  "reseller.login_created": "Accès revendeur créé",
  "reseller.password_reset": "Mot de passe revendeur réinitialisé",
  "admin.created": "Administrateur créé",
  "admin.deleted": "Administrateur supprimé",
  "admin.password_reset": "Mot de passe admin réinitialisé",
};
