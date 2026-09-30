import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CAR_BRANDS, productFitsModel } from "@/lib/data";
import { listProducts } from "@/lib/server/queries";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  const products = listProducts();
  const fitCounts = Object.fromEntries(
    CAR_BRANDS.flatMap((b) => b.models).map((m) => [m.id, products.filter((p) => productFitsModel(p, m.id)).length]),
  );

  return (
    <>
      <SiteHeader fitCounts={fitCounts} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
