import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PasswordForm } from "./PasswordForm";

export default function EspaceParametresPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Paramètres" description="Préférences de votre espace revendeur." />

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Apparence</p>
        </CardHeader>
        <CardBody>
          <ThemeToggle />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-display text-lg text-ink">Mot de passe</p>
        </CardHeader>
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
