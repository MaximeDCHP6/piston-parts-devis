"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { RevealedSecret } from "@/components/ui/RevealedSecret";
import { resetAdminPassword, type ResetAdminPasswordState } from "./actions";

const initialState: ResetAdminPasswordState = { error: null, password: null };

export function AdminResetButton({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(resetAdminPassword.bind(null, userId), initialState);

  if (state.password) {
    return <RevealedSecret label="Nouveau mot de passe (affiché une seule fois) :" value={state.password} />;
  }

  return (
    <form action={formAction}>
      <ConfirmSubmitButton confirmMessage="Réinitialiser le mot de passe de cet administrateur ?" className="text-accent">
        Réinitialiser le mot de passe
      </ConfirmSubmitButton>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
