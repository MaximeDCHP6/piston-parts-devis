"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { RevealedSecret } from "@/components/ui/RevealedSecret";
import type { CreateLoginState, ResetPasswordState } from "../actions";

export function ResellerLoginPanel({
  resellerId,
  contactEmail,
  hasAccount,
  action,
  resetAction,
}: {
  resellerId: string;
  contactEmail: string;
  hasAccount: boolean;
  action: (prevState: CreateLoginState, formData: FormData) => Promise<CreateLoginState>;
  resetAction: (prevState: ResetPasswordState, formData: FormData) => Promise<ResetPasswordState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, password: null });
  const [resetState, resetFormAction, resetPending] = useActionState(resetAction, { error: null, password: null });

  // Important : on vérifie les mots de passe fraîchement générés avant
  // `hasAccount`. La création/réinitialisation déclenche un
  // `revalidatePath` qui rafraîchit `hasAccount` sur ce même rendu — si on
  // testait `hasAccount` en premier, le mot de passe ne serait jamais
  // affiché (il n'est montré qu'une seule fois, aucun envoi automatique).
  const revealedPassword = state.password ?? resetState.password;

  return (
    <Card>
      <CardHeader>
        <p className="font-display text-lg text-ink">Accès à l&apos;espace revendeur</p>
      </CardHeader>
      <CardBody>
        {revealedPassword ? (
          <RevealedSecret
            label="Communiquez ces identifiants au revendeur par vos propres moyens (ce mot de passe ne sera plus jamais affiché) :"
            value={revealedPassword}
          />
        ) : hasAccount ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Ce revendeur dispose déjà d&apos;un compte de connexion à l&apos;espace revendeur.
            </p>
            <form action={resetFormAction}>
              <ConfirmSubmitButton
                confirmMessage="Réinitialiser le mot de passe de ce revendeur ? Son ancien mot de passe cessera de fonctionner."
                className="text-accent"
              >
                {resetPending ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
              </ConfirmSubmitButton>
            </form>
            {resetState.error && <p className="text-sm text-danger">{resetState.error}</p>}
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="resellerId" value={resellerId} />
            <Field label="E-mail de connexion" htmlFor="login-email">
              <Input id="login-email" name="email" type="email" defaultValue={contactEmail} required />
            </Field>
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Création…" : "Créer l'accès"}
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
