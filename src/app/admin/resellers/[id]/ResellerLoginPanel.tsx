"use client";

import { useActionState, useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { CreateLoginState } from "../actions";

export function ResellerLoginPanel({
  resellerId,
  contactEmail,
  hasAccount,
  action,
}: {
  resellerId: string;
  contactEmail: string;
  hasAccount: boolean;
  action: (prevState: CreateLoginState, formData: FormData) => Promise<CreateLoginState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, password: null });
  const [copied, setCopied] = useState(false);

  if (hasAccount) {
    return (
      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Accès à l&apos;espace revendeur</p>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted">
            Ce revendeur dispose déjà d&apos;un compte de connexion à l&apos;espace revendeur.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-display text-lg text-ink">Accès à l&apos;espace revendeur</p>
      </CardHeader>
      <CardBody>
        {state.password ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink">
              Compte créé. Communiquez ces identifiants au revendeur par vos propres moyens (ce mot de passe ne sera plus jamais affiché) :
            </p>
            <div className="flex items-center gap-2 rounded-sm border border-border bg-paper px-3 py-2 font-mono text-sm">
              {state.password}
            </div>
            <button
              type="button"
              className="self-start text-sm text-accent hover:underline"
              onClick={() => {
                navigator.clipboard.writeText(state.password ?? "");
                setCopied(true);
              }}
            >
              {copied ? "Copié !" : "Copier le mot de passe"}
            </button>
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
