// Brouillon local (localStorage) de la création de devis : évite de tout
// retaper si la page est quittée par erreur avant l'enregistrement.
// Uniquement pour un nouveau devis, jamais en édition d'un devis existant.
export const QUOTE_DRAFT_FIELDS_KEY = "piston:new-quote-draft:fields";
export const QUOTE_DRAFT_LINES_KEY = "piston:new-quote-draft:lines";

export function clearQuoteDraft() {
  try {
    localStorage.removeItem(QUOTE_DRAFT_FIELDS_KEY);
    localStorage.removeItem(QUOTE_DRAFT_LINES_KEY);
  } catch {
    // ignore (navigateur privé, quota…)
  }
}
