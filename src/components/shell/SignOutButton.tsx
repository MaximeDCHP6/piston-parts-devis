import { signOut } from "@/app/login/actions";

export function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="w-full rounded-sm border border-border px-3 py-2 text-left text-sm text-ink hover:border-ink"
      >
        <span className="block text-xs text-muted">{label}</span>
        Se déconnecter
      </button>
    </form>
  );
}
