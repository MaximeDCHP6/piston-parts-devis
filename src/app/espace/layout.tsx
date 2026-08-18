import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";

const NAV_ITEMS = [
  { href: "/espace", label: "Tableau de bord" },
  { href: "/espace/devis", label: "Devis" },
  { href: "/espace/commandes", label: "Commandes" },
  { href: "/espace/documents", label: "Documents" },
];

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "revendeur") {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: reseller } = await supabase
    .from("resellers")
    .select("company_name")
    .eq("user_id", user.id)
    .single();

  return (
    <AppShell
      brand={reseller?.company_name ?? "Mon espace"}
      subtitle="Espace revendeur"
      navItems={NAV_ITEMS}
      footer={<SignOutButton label={user.email ?? ""} />}
    >
      {children}
    </AppShell>
  );
}
