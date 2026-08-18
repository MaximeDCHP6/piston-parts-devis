import { PageHeader } from "@/components/ui/PageHeader";
import { ProductForm } from "../ProductForm";
import { createProduct } from "../actions";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau produit" />
      <ProductForm action={createProduct} />
    </div>
  );
}
