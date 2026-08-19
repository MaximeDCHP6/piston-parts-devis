"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { QuoteLinesEditor, type EditableLine, type PriceHistoryEntry } from "./QuoteLinesEditor";
import { QUOTE_DRAFT_FIELDS_KEY, clearQuoteDraft } from "./draftStorage";
import type { QuoteFormState } from "./actions";
import type { ClientContact, Product, Quote, Reseller } from "@/lib/types/database";

const initialState: QuoteFormState = { error: null };

interface DraftFields {
  resellerId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  validUntil: string;
  quoteNumber: string;
  orderNumber: string;
  vehicleRegistration: string;
}

export function QuoteForm({
  action,
  resellers,
  products,
  clientContacts,
  priceHistory,
  initialQuote,
  initialLines,
}: {
  action: (prevState: QuoteFormState, formData: FormData) => Promise<QuoteFormState>;
  resellers: Reseller[];
  products: Product[];
  clientContacts: ClientContact[];
  priceHistory?: Record<string, PriceHistoryEntry>;
  initialQuote?: Quote;
  initialLines?: EditableLine[];
}) {
  const isCreateMode = !initialQuote;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [resellerId, setResellerId] = useState(initialQuote?.reseller_id ?? "");
  const [clientName, setClientName] = useState(initialQuote?.client_name ?? "");
  const [clientEmail, setClientEmail] = useState(initialQuote?.client_email ?? "");
  const [clientAddress, setClientAddress] = useState(initialQuote?.client_address ?? "");
  const [validUntil, setValidUntil] = useState(initialQuote?.valid_until ?? "");
  const [quoteNumber, setQuoteNumber] = useState(initialQuote?.quote_number ?? "");
  const [orderNumber, setOrderNumber] = useState(initialQuote?.order_number ?? "");
  const [vehicleRegistration, setVehicleRegistration] = useState(initialQuote?.vehicle_registration ?? "");
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [linesResetKey, setLinesResetKey] = useState(0);

  // Récupère un brouillon laissé par une session précédente (page quittée
  // sans enregistrer) — uniquement à la création d'un nouveau devis.
  useEffect(() => {
    if (!isCreateMode) return;
    try {
      const raw = localStorage.getItem(QUOTE_DRAFT_FIELDS_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<DraftFields>;
        const hasContent = Object.values(draft).some(Boolean);
        if (hasContent) {
          /* eslint-disable react-hooks/set-state-in-effect -- restauration ponctuelle
             d'un brouillon localStorage au montage, pas de cascade de rendus */
          if (draft.resellerId) setResellerId(draft.resellerId);
          if (draft.clientName) setClientName(draft.clientName);
          if (draft.clientEmail) setClientEmail(draft.clientEmail);
          if (draft.clientAddress) setClientAddress(draft.clientAddress);
          if (draft.validUntil) setValidUntil(draft.validUntil);
          if (draft.quoteNumber) setQuoteNumber(draft.quoteNumber);
          if (draft.orderNumber) setOrderNumber(draft.orderNumber);
          if (draft.vehicleRegistration) setVehicleRegistration(draft.vehicleRegistration);
          setRestoredDraft(true);
          /* eslint-enable react-hooks/set-state-in-effect */
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isCreateMode) return;
    const draft: DraftFields = {
      resellerId,
      clientName,
      clientEmail,
      clientAddress,
      validUntil,
      quoteNumber,
      orderNumber,
      vehicleRegistration,
    };
    try {
      localStorage.setItem(QUOTE_DRAFT_FIELDS_KEY, JSON.stringify(draft));
    } catch {
      // ignore (quota, navigateur privé…)
    }
  }, [
    isCreateMode,
    resellerId,
    clientName,
    clientEmail,
    clientAddress,
    validUntil,
    quoteNumber,
    orderNumber,
    vehicleRegistration,
  ]);

  const marginPercent = resellers.find((r) => r.id === resellerId)?.margin_percent ?? 0;
  const contactsForReseller = useMemo(
    () => clientContacts.filter((c) => c.reseller_id === resellerId),
    [clientContacts, resellerId],
  );

  function onContactPick(contactId: string) {
    const contact = contactsForReseller.find((c) => c.id === contactId);
    if (!contact) return;
    setClientName(contact.name);
    setClientEmail(contact.email ?? "");
    setClientAddress(contact.address ?? "");
  }

  function discardDraft() {
    clearQuoteDraft();
    setResellerId("");
    setClientName("");
    setClientEmail("");
    setClientAddress("");
    setValidUntil("");
    setQuoteNumber("");
    setOrderNumber("");
    setVehicleRegistration("");
    setRestoredDraft(false);
    setLinesResetKey((k) => k + 1);
  }

  return (
    <form action={formAction} onSubmit={() => isCreateMode && clearQuoteDraft()} className="flex flex-col gap-6">
      {restoredDraft && (
        <p className="rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Brouillon restauré depuis votre dernière saisie.{" "}
          <button type="button" onClick={discardDraft} className="underline">
            Repartir de zéro
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Revendeur" htmlFor="reseller_id" hint={`Marge appliquée : ${marginPercent}%`}>
          <Select
            id="reseller_id"
            name="reseller_id"
            required
            value={resellerId}
            onChange={(e) => setResellerId(e.target.value)}
          >
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
          <Input id="valid_until" name="valid_until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </Field>
        <Field label="N° de devis" htmlFor="quote_number" hint="Saisi manuellement, selon votre propre numérotation. Laissé vide, une référence est générée automatiquement.">
          <Input id="quote_number" name="quote_number" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} />
        </Field>

        {resellerId && (
          <Field
            label="Client existant"
            htmlFor="existing_contact"
            className="sm:col-span-2"
            hint={
              contactsForReseller.length > 0
                ? "Sélectionner pour pré-remplir les champs ci-dessous. Une nouvelle adresse saisie est automatiquement enregistrée."
                : "Aucun client enregistré pour ce revendeur pour l'instant — la nouvelle adresse saisie ci-dessous sera automatiquement enregistrée."
            }
          >
            <Select
              id="existing_contact"
              onChange={(e) => onContactPick(e.target.value)}
              defaultValue=""
              disabled={contactsForReseller.length === 0}
            >
              <option value="">— Nouvelle adresse —</option>
              {contactsForReseller.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Nom du client final" htmlFor="client_name">
          <Input id="client_name" name="client_name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </Field>
        <Field label="E-mail du client final" htmlFor="client_email">
          <Input id="client_email" name="client_email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
        </Field>
        <Field label="N° de commande" htmlFor="order_number" hint="Facultatif — référence du bon de commande client.">
          <Input id="order_number" name="order_number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
        </Field>
        <Field label="Immatriculation du véhicule" htmlFor="vehicle_registration" hint="Facultatif — utile pour les pièces auto.">
          <Input
            id="vehicle_registration"
            name="vehicle_registration"
            placeholder="Ex. FD-521-HB"
            value={vehicleRegistration}
            onChange={(e) => setVehicleRegistration(e.target.value)}
          />
        </Field>
        <Field label="Adresse de livraison du client" htmlFor="client_address" hint="Affichée sur le devis PDF, section « Livraison à »." className="sm:col-span-2">
          <Textarea
            id="client_address"
            name="client_address"
            rows={2}
            placeholder={"Nom de la société\nAdresse\nCode postal, ville"}
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
          />
        </Field>
      </div>

      <QuoteLinesEditor
        key={linesResetKey}
        products={products}
        marginPercent={marginPercent}
        resellerId={resellerId}
        priceHistory={priceHistory}
        initialLines={initialLines}
        allowDraftRestore={isCreateMode}
      />

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : initialQuote ? "Enregistrer les modifications" : "Créer le devis"}
        </Button>
        <ButtonLink href="/admin/quotes" variant="secondary">
          Annuler
        </ButtonLink>
      </div>
    </form>
  );
}
