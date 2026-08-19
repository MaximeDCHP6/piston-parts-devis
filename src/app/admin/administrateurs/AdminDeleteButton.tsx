"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { deleteAdminAccount, type DeleteAdminState } from "./actions";

const initialState: DeleteAdminState = { error: null };

export function AdminDeleteButton({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(deleteAdminAccount.bind(null, userId), initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <ConfirmSubmitButton confirmMessage="Supprimer définitivement ce compte administrateur ?">
        Supprimer
      </ConfirmSubmitButton>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
