"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="flex min-h-screen">
      <aside
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink px-12 py-16 text-paper lg:flex"
        style={{
          backgroundImage: "radial-gradient(rgba(250,248,245,0.14) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div>
          <p className="font-display text-4xl">Piston</p>
          <div className="mt-4 h-px w-16 bg-paper/30" />
          <p className="mt-6 max-w-xs text-sm text-paper/70">
            Devis en marque blanche pour le réseau de revendeurs de la societé ALDER.
          </p>
        </div>
        <p className="text-xs text-paper/50">ALDER France</p>
      </aside>

      <div className="flex flex-1 items-center justify-center bg-paper px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <p className="font-display text-2xl text-ink lg:hidden">Piston</p>
            <p className="mt-1 text-sm text-muted">Connexion à votre espace</p>
          </div>
          <form action={formAction} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-6 shadow-sm">
            <Field label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="username" required />
            </Field>
            <Field label="Mot de passe" htmlFor="password">
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </Field>
            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
