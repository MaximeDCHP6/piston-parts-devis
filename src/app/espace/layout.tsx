import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { IconGrid, IconFileText, IconCart, IconFolder, IconSettings } from "@/components/icons";
import { resellerGlobalSearch } from "./search-actions";

const NAV_ITEMS = [
  { href: "/espace", label: "Tableau de bord", icon: <IconGrid /> },
  { href: "/espace/devis", label: "Devis", icon: <IconFileText /> },
  { href: "/espace/commandes", label: "Commandes", icon: <IconCart /> },
  { href: "/espace/documents", label: "Documents", icon: <IconFolder /> },
  { href: "/espace/parametres", label: "Paramètres", icon: <IconSettings /> },
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
      subtitle="Espace revendeur · Piston"
      navItems={NAV_ITEMS}
      footer={<SignOutButton label={user.email ?? ""} />}
      searchAction={resellerGlobalSearch}
    >
      {children}
    </AppShell>
  );
}
