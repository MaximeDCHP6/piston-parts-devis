"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { RevealedSecret } from "@/components/ui/RevealedSecret";
import { createAdminAccount, type CreateAdminState } from "./actions";

const initialState: CreateAdminState = { error: null, password: null };

export function AdminCreateForm() {
  const [state, formAction, pending] = useActionState(createAdminAccount, initialState);

  if (state.password) {
    return (
      <RevealedSecret
        label="Compte admin créé. Communiquez ce mot de passe vous-même (il ne sera plus jamais affiché) :"
        value={state.password}
      />
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
      <Field label="E-mail du nouvel administrateur" htmlFor="admin-email">
        <Input id="admin-email" name="email" type="email" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer l'accès"}
      </Button>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
