"use client";

import { useActionState } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { QuoteLinesEditor } from "./QuoteLinesEditor";
import { createQuote, type QuoteFormState } from "./actions";
import type { Product, Reseller } from "@/lib/types/database";

const initialState: QuoteFormState = { error: null };

export function QuoteForm({ resellers, products }: { resellers: Reseller[]; products: Product[] }) {
  const [state, formAction, pending] = useActionState(createQuote, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Revendeur" htmlFor="reseller_id">
          <Select id="reseller_id" name="reseller_id" required defaultValue="">
            <option value="" disabled>
              Sélectionner…
            </option>
            {resellers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.company_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date de validité" htmlFor="valid_until">
          <Input id="valid_until" name="valid_until" type="date" />
        </Field>
        <Field label="Nom du client final" htmlFor="client_name" hint="Nécessaire pour générer le devis miroir destiné au client.">
          <Input id="client_name" name="client_name" />
        </Field>
        <Field label="E-mail du client final" htmlFor="client_email">
          <Input id="client_email" name="client_email" type="email" />
        </Field>
      </div>

      <QuoteLinesEditor products={products} />

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le devis"}
        </Button>
        <ButtonLink href="/admin/quotes" variant="secondary">
          Annuler
        </ButtonLink>
      </div>
    </form>
  );
}
