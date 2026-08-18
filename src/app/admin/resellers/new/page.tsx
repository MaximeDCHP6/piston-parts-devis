import { PageHeader } from "@/components/ui/PageHeader";
import { ResellerForm } from "../ResellerForm";
import { createReseller } from "../actions";

export default function NewResellerPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau revendeur" />
      <ResellerForm action={createReseller} />
    </div>
  );
}
