import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";
import { IconGrid, IconFileText, IconCart, IconUsers, IconPackage, IconUserCog, IconHistory } from "@/components/icons";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord", icon: <IconGrid /> },
  { href: "/admin/quotes", label: "Devis", icon: <IconFileText /> },
  { href: "/admin/orders", label: "Commandes", icon: <IconCart /> },
  { href: "/admin/resellers", label: "Revendeurs", icon: <IconUsers /> },
  { href: "/admin/products", label: "Catalogue", icon: <IconPackage /> },
  { href: "/admin/administrateurs", label: "Administrateurs", icon: <IconUserCog /> },
  { href: "/admin/journal", label: "Journal", icon: <IconHistory /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "admin") {
    redirect("/login");
  }

  return (
    <AppShell
      brand="Piston"
      subtitle="Gravelin Parts · Admin"
      navItems={NAV_ITEMS}
      footer={<SignOutButton label={user.email ?? ""} />}
    >
      {children}
    </AppShell>
  );
}
