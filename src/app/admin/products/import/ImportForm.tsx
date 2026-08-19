"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { importProductsCsv, type ImportState } from "./actions";

const initialState: ImportState = { error: null };
const TEMPLATE_CSV = "sku,name,description,category,purchase_price\nH7-24V,Phare Avant Gauche 24V H7,,Eclairage,299.50\n";

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importProductsCsv, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      <Field label="Fichier CSV" htmlFor="file" hint="Colonnes attendues : sku, name, description, category, purchase_price.">
        <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Import…" : "Importer"}
        </Button>
        <ButtonLink href="/admin/products" variant="secondary">
          Annuler
        </ButtonLink>
      </div>
      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`}
        download="modele-produits.csv"
        className="self-start text-sm text-accent hover:underline"
      >
        Télécharger un modèle CSV
      </a>
    </form>
  );
}
