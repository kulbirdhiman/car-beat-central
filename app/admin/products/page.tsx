import { Suspense } from "react";
import { ProductsManager } from "./ProductsManager";

export const metadata = { title: "Products · Admin · CarBeat" };

export default function AdminProductsPage() {
  // ProductsManager reads ?department= from the URL, which needs a Suspense boundary.
  return (
    <Suspense>
      <ProductsManager />
    </Suspense>
  );
}
