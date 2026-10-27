import { CarBrandsProvider } from "@/components/layout/CarBrandsProvider";
import { ChatButton } from "@/components/layout/ChatButton";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getStoreChromeData } from "@/lib/server/home-data";
import { connection } from "next/server";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  await connection();
  const { departments, brands, total } = await getStoreChromeData();
  return (
    <CarBrandsProvider brands={brands}>
      <SiteHeader departments={departments} total={total} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter departments={departments} />
      <ChatButton />
    </CarBrandsProvider>
  );
}
