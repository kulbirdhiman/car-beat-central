import { DepartmentsManager } from "../DepartmentsManager";

export const metadata = { title: "Sub-departments · Admin · CarBeat" };

export default async function AdminSubDepartmentsPage(props: PageProps<"/admin/departments/[id]">) {
  const { id } = await props.params;
  return <DepartmentsManager parentId={id} />;
}
