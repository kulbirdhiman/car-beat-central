import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCategoryCounts } from "@/lib/server/queries";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader counts={getCategoryCounts()} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
