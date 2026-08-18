"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { Product } from "@/lib/types/database";
import type { ProductFormState } from "./actions";

export function ProductForm({
  action,
  product,
}: {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: Product;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Field label="Nom" htmlFor="name">
        <Input id="name" name="name" defaultValue={product?.name} required />
      </Field>
      <Field label="SKU / référence" htmlFor="sku">
        <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
      </Field>
      <Field label="Catégorie" htmlFor="category">
        <Input id="category" name="category" defaultValue={product?.category ?? ""} />
      </Field>
      <Field
        label="Prix d'achat (€)"
        htmlFor="purchase_price"
        hint="Visible uniquement par l'admin, jamais par les revendeurs."
      >
        <Input
          id="purchase_price"
          name="purchase_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.purchase_price ?? ""}
        />
      </Field>
      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={3} defaultValue={product?.description ?? ""} />
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <ButtonLink href="/admin/products" variant="secondary">
          Annuler
        </ButtonLink>
      </div>
    </form>
  );
}
