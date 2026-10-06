import { CarBrandsProvider } from "@/components/layout/CarBrandsProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCarBrands, getProductCount, getStoreDepartments } from "@/lib/server/queries";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  const departments = getStoreDepartments();
  return (
    <CarBrandsProvider brands={getCarBrands()}>
      <SiteHeader departments={departments} total={getProductCount()} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter departments={departments} />
    </CarBrandsProvider>
  );
}
