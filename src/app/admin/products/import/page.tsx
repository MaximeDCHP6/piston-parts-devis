import { PageHeader } from "@/components/ui/PageHeader";
import { ImportForm } from "./ImportForm";

export default function ImportProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Importer des produits" description="Ajout en masse depuis un fichier CSV." />
      <ImportForm />
    </div>
  );
}
