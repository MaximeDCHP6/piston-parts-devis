// Les clés de stockage Supabase n'acceptent pas n'importe quel caractère
// (espaces, apostrophes, accents...) — un nom de fichier reel comme
// "FACTURE de l'expedition N 1.PDF" est rejete avec "Invalid key". On ne
// touche jamais au nom affiche a l'ecran (`label`), seulement au chemin de
// stockage lui-meme.
const DIACRITICS_REGEX = new RegExp("[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]", "g");

export function sanitizeFilename(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const hasExt = lastDot > 0 && lastDot < name.length - 1;
  const base = hasExt ? name.slice(0, lastDot) : name;
  const ext = hasExt ? name.slice(lastDot + 1) : "";

  const safeBase =
    base
      .normalize("NFD")
      .replace(DIACRITICS_REGEX, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "fichier";
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "");

  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}
