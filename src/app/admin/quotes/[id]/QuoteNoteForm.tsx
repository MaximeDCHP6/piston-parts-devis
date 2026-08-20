"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { QuoteNoteState } from "../actions";

const initialState: QuoteNoteState = { error: null };

export function QuoteNoteForm({
  action,
  initialNote,
}: {
  action: (prevState: QuoteNoteState, formData: FormData) => Promise<QuoteNoteState>;
  initialNote: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Textarea name="note" defaultValue={initialNote} rows={3} placeholder="Ex. relancé le 12/03, en attente de validation client…" />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer la note"}
        </Button>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
      </div>
    </form>
  );
}
