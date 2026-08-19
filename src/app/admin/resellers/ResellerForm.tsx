"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { Reseller } from "@/lib/types/database";
import type { ResellerFormState } from "./actions";

export function ResellerForm({
  action,
  reseller,
}: {
  action: (prevState: ResellerFormState, formData: FormData) => Promise<ResellerFormState>;
  reseller?: Reseller;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <Field label="Nom de la société" htmlFor="company_name">
        <Input id="company_name" name="company_name" defaultValue={reseller?.company_name} required />
      </Field>

      <Field label="E-mail de contact" htmlFor="contact_email" hint="Utilisé pour pré-remplir les mails générés (Reply-To) et affiché sur le devis.">
        <Input id="contact_email" name="contact_email" type="email" defaultValue={reseller?.contact_email ?? ""} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Téléphone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={reseller?.phone ?? ""} />
        </Field>
        <Field label="Siret" htmlFor="siret">
          <Input id="siret" name="siret" defaultValue={reseller?.siret ?? ""} />
        </Field>
        <Field label="TVA Intra" htmlFor="vat_intra">
          <Input id="vat_intra" name="vat_intra" defaultValue={reseller?.vat_intra ?? ""} />
        </Field>
      </div>

      <Field label="Taux de marge (%)" htmlFor="margin_percent" hint="Appliqué automatiquement sur le devis destiné au client final.">
        <Input
          id="margin_percent"
          name="margin_percent"
          type="number"
          step="0.01"
          min="0"
          defaultValue={reseller?.margin_percent ?? 0}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Couleur principale" htmlFor="primary_color">
          <Input id="primary_color" name="primary_color" type="color" defaultValue={reseller?.primary_color ?? "#1a1a1a"} className="h-10 p-1" />
        </Field>
        <Field label="Couleur secondaire" htmlFor="secondary_color">
          <Input id="secondary_color" name="secondary_color" type="color" defaultValue={reseller?.secondary_color ?? "#6b6b6b"} className="h-10 p-1" />
        </Field>
      </div>

      <Field label="Logo" htmlFor="logo" hint="PNG/JPG, utilisé sur le devis et le PDF du client final.">
        {reseller?.logo_url && (
          <Image src={reseller.logo_url} alt="" width={96} height={40} className="mb-2 h-10 w-auto object-contain" unoptimized />
        )}
        <Input id="logo" name="logo" type="file" accept="image/*" />
      </Field>

      <Field label="Adresse" htmlFor="legal_mentions" hint="Une ligne par ligne d'adresse, affichée sous le nom sur le devis.">
        <Textarea id="legal_mentions" name="legal_mentions" rows={3} defaultValue={reseller?.legal_mentions ?? ""} />
      </Field>

      <Field label="Signature (bas de devis)" htmlFor="signature_text">
        <Textarea id="signature_text" name="signature_text" rows={2} defaultValue={reseller?.signature_text ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <ButtonLink href="/admin/resellers" variant="secondary">
          Annuler
        </ButtonLink>
      </div>
    </form>
  );
}
