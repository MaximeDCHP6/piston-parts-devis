"use client";

import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { UploadFileState } from "./actions";

const initialState: UploadFileState = { error: null };

export function UploadFileForm({
  action,
}: {
  action: (prevState: UploadFileState, formData: FormData) => Promise<UploadFileState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
      <Field label="Fichier" htmlFor="file">
        <Input id="file" name="file" type="file" required />
      </Field>
      <Field label="Libellé" htmlFor="label">
        <Input id="label" name="label" placeholder="Ex. Facture janvier 2026" />
      </Field>
      <Field label="Type" htmlFor="type">
        <Select id="type" name="type" defaultValue="invoice">
          <option value="invoice">Facture</option>
          <option value="quote">Devis</option>
          <option value="other">Autre document</option>
        </Select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Déposer"}
      </Button>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
