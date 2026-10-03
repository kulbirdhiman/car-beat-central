import { ModelsTable } from "./ModelsTable";

export const metadata = { title: "Models · Vehicle Categories · Admin · CarBeat" };

export default async function AdminMakePage(props: PageProps<"/admin/categories/[makeId]">) {
  const { makeId } = await props.params;
  return <ModelsTable makeId={makeId} />;
}
