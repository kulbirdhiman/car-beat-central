import { EditProduct } from "./EditProduct";

export const metadata = { title: "Edit product · Admin · CarBeat" };

export default async function AdminEditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  return <EditProduct id={id} />;
}
