import { CarBrandsProvider } from "@/components/layout/CarBrandsProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCarBrands, getProductCount, getStoreDepartments } from "@/lib/server/queries";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [departments, brands, total] = await Promise.all([getStoreDepartments(), getCarBrands(), getProductCount()]);
  return (
    <CarBrandsProvider brands={brands}>
      <SiteHeader departments={departments} total={total} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter departments={departments} />
    </CarBrandsProvider>
  );
}
