"use client";

import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { UploadQuoteFileState } from "../actions";

const initialState: UploadQuoteFileState = { error: null };

export function QuoteFileUploadForm({
  action,
}: {
  action: (prevState: UploadQuoteFileState, formData: FormData) => Promise<UploadQuoteFileState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
      <Field label="Fichier (devis/facture ERP)" htmlFor="quote-file">
        <Input id="quote-file" name="file" type="file" required />
      </Field>
      <Field label="Libellé" htmlFor="quote-file-label">
        <Input id="quote-file-label" name="label" placeholder="Ex. Facture FD-521-HB" />
      </Field>
      <Field label="Type" htmlFor="quote-file-type">
        <Select id="quote-file-type" name="type" defaultValue="invoice">
          <option value="invoice">Facture</option>
          <option value="quote">Devis</option>
          <option value="other">Autre document</option>
        </Select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Joindre"}
      </Button>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
