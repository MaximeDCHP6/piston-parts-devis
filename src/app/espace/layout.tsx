import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { IconGrid, IconFileText, IconCart, IconFolder, IconSettings } from "@/components/icons";
import { resellerGlobalSearch } from "./search-actions";

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "revendeur") {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: reseller } = await supabase
    .from("resellers")
    .select("id, company_name")
    .eq("user_id", user.id)
    .single();

  const { count: preparationCount } = reseller
    ? await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("reseller_id", reseller.id)
        .eq("status", "preparation")
    : { count: 0 };

  const navItems = [
    { href: "/espace", label: "Tableau de bord", icon: <IconGrid /> },
    { href: "/espace/devis", label: "Devis", icon: <IconFileText /> },
    { href: "/espace/commandes", label: "Commandes", icon: <IconCart />, badge: preparationCount ?? 0 },
    { href: "/espace/documents", label: "Documents", icon: <IconFolder /> },
    { href: "/espace/parametres", label: "Paramètres", icon: <IconSettings /> },
  ];

  return (
    <AppShell
      brand={reseller?.company_name ?? "Mon espace"}
      subtitle="Espace revendeur · Piston"
      navItems={navItems}
      footer={<SignOutButton label={user.email ?? ""} />}
      searchAction={resellerGlobalSearch}
    >
      {children}
    </AppShell>
  );
}
