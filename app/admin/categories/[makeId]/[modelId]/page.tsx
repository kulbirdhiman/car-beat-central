import { SubModelsTable } from "./SubModelsTable";

export const metadata = { title: "Sub-models · Vehicle Categories · Admin · CarBeat" };

export default async function AdminModelPage(props: PageProps<"/admin/categories/[makeId]/[modelId]">) {
  const { makeId, modelId } = await props.params;
  return <SubModelsTable makeId={makeId} modelId={modelId} />;
}
