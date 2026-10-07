"use client";

import Link from "next/link";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Empty, PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ProductForm } from "../../ProductForm";

export function EditProduct({ id }: { id: string }) {
  const product = useAdminStore().products.find((p) => p.id === id);
  if (!product) {
    return (
      <>
        <PageHeader title="Product not found" />
        <Empty>
          It may have been deleted.{" "}
          <Button variant="link" asChild className="px-0">
            <Link href="/admin/products">Back to products</Link>
          </Button>
        </Empty>
      </>
    );
  }
  return <ProductForm key={product.id} product={product} />;
}
