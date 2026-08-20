import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { IconGrid, IconFileText, IconCart, IconUsers, IconPackage, IconUserCog, IconHistory } from "@/components/icons";
import { adminGlobalSearch } from "./search-actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "admin") {
    redirect("/login");
  }

  const supabase = await createClient();
  const [{ count: draftCount }, { count: preparationCount }] = await Promise.all([
    supabase.from("quotes").select("*", { count: "exact", head: true }).eq("type", "to_client").eq("status", "draft"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "preparation"),
  ]);

  const navItems = [
    { href: "/admin", label: "Tableau de bord", icon: <IconGrid /> },
    { href: "/admin/quotes", label: "Devis", icon: <IconFileText />, badge: draftCount ?? 0 },
    { href: "/admin/orders", label: "Commandes", icon: <IconCart />, badge: preparationCount ?? 0 },
    { href: "/admin/resellers", label: "Revendeurs", icon: <IconUsers /> },
    { href: "/admin/products", label: "Catalogue", icon: <IconPackage /> },
    { href: "/admin/administrateurs", label: "Administrateurs", icon: <IconUserCog /> },
    { href: "/admin/journal", label: "Journal", icon: <IconHistory /> },
  ];

  return (
    <AppShell
      brand="Piston"
      subtitle="Gravelin Parts · Admin"
      navItems={navItems}
      footer={<SignOutButton label={user.email ?? ""} />}
      searchAction={adminGlobalSearch}
    >
      {children}
    </AppShell>
  );
}
