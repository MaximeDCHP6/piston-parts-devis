import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/shell/AppShell";
import { SignOutButton } from "@/components/shell/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/quotes", label: "Devis" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/resellers", label: "Revendeurs" },
  { href: "/admin/products", label: "Catalogue" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== "admin") {
    redirect("/login");
  }

  return (
    <AppShell
      brand="Gravelin Parts"
      subtitle="Espace admin"
      navItems={NAV_ITEMS}
      footer={<SignOutButton label={user.email ?? ""} />}
    >
      {children}
    </AppShell>
  );
}
