"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { ClientContactFormState } from "./actions";

const initialState: ClientContactFormState = { error: null };

export function ClientContactForm({
  action,
}: {
  action: (prevState: ClientContactFormState, formData: FormData) => Promise<ClientContactFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap sm:gap-3">
      <Field label="Nom du client" htmlFor="name">
        <Input id="name" name="name" required />
      </Field>
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" />
      </Field>
      <Field label="Adresse" htmlFor="address" className="sm:min-w-[260px]">
        <Textarea id="address" name="address" rows={2} placeholder={"Nom de la société\nAdresse\nCode postal, ville"} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter"}
      </Button>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
