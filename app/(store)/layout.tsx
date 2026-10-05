import { CarBrandsProvider } from "@/components/layout/CarBrandsProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCarBrands, getCategoryCounts } from "@/lib/server/queries";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <CarBrandsProvider brands={getCarBrands()}>
      <SiteHeader counts={getCategoryCounts()} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </CarBrandsProvider>
  );
}
