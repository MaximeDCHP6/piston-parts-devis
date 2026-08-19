"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { changePassword, type PasswordFormState } from "./actions";

const initialState: PasswordFormState = { error: null, success: false };

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <Field label="Nouveau mot de passe" htmlFor="password" hint="Au moins 8 caractères.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label="Confirmer le mot de passe" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">Mot de passe mis à jour.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Mise à jour…" : "Mettre à jour le mot de passe"}
      </Button>
    </form>
  );
}
