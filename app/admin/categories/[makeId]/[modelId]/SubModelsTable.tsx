"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { idFrom, useAdminStore } from "@/components/admin/AdminStore";
import { RowActions } from "@/components/admin/RowActions";
import { SortableTable } from "@/components/admin/SortableTable";
import { Empty, PageHeader, fmtDate } from "@/components/admin/ui";
import { VehicleBreadcrumb } from "@/components/admin/VehicleBreadcrumb";
import { VehicleDialog } from "@/components/admin/VehicleDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SubModel } from "@/lib/admin/model";

export function SubModelsTable({ makeId, modelId }: { makeId: string; modelId: string }) {
  const { makes, saveSubModel, deleteSubModel, reorderSubModels } = useAdminStore();
  const [editing, setEditing] = useState<SubModel | "new" | null>(null);
  const [deleting, setDeleting] = useState<SubModel | null>(null);

  const make = makes.find((m) => m.id === makeId);
  const model = make?.models.find((m) => m.id === modelId);
  if (!make || !model) {
    return (
      <>
        <VehicleBreadcrumb
          trail={[
            ...(make ? [{ label: make.name, href: `/admin/categories/${make.id}` }] : []),
            { label: "Not found", href: `/admin/categories/${makeId}/${modelId}` },
          ]}
        />
        <Empty>
          That model doesn&apos;t exist (it may have been deleted).{" "}
          <Link href={make ? `/admin/categories/${make.id}` : "/admin/categories"} className="underline">
            Go back
          </Link>
        </Empty>
      </>
    );
  }

  const fullName = `${make.name} ${model.name}`;
  const allSubIds = makes.flatMap((m) => m.models.flatMap((x) => x.subModels.map((s) => s.id)));

  return (
    <>
      <VehicleBreadcrumb
        trail={[
          { label: make.name, href: `/admin/categories/${make.id}` },
          { label: model.name, href: `/admin/categories/${make.id}/${model.id}` },
        ]}
      />
      <PageHeader
        title={`${fullName} sub-models`}
        description={model.description || "Variants and generations. Drag rows to reorder."}
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add sub-model
          </Button>
        }
      />

      <Card>
        <CardContent>
          {model.subModels.length === 0 ? (
            <Empty>No sub-models for {fullName} yet.</Empty>
          ) : (
            <SortableTable
              rows={model.subModels}
              onReorder={(rows) => reorderSubModels(make.id, model.id, rows)}
              rowLabel={(s) => s.name}
              columns={[
                { header: "Sub-model", cell: (s) => <span className="font-medium">{s.name}</span> },
                { header: "Description", className: "hidden max-w-96 whitespace-normal text-muted-foreground md:table-cell", cell: (s) => s.description || "—" },
                { header: "Years", className: "whitespace-nowrap", cell: (s) => s.years || "—" },
                { header: "Created", className: "hidden whitespace-nowrap text-muted-foreground lg:table-cell", cell: (s) => fmtDate(s.createdAt) },
                {
                  header: <span className="sr-only">Actions</span>,
                  className: "w-20",
                  cell: (s) => <RowActions label={s.name} onEdit={() => setEditing(s)} onDelete={() => setDeleting(s)} />,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {editing && (
        <VehicleDialog
          level="subModel"
          parent={fullName}
          initial={editing === "new" ? undefined : { name: editing.name, description: editing.description, extra: editing.years }}
          onClose={() => setEditing(null)}
          onSave={({ name, description, extra }) =>
            saveSubModel(make.id, model.id, {
              id: editing === "new" ? idFrom(`${model.id}-${name}`, allSubIds) : editing.id,
              name,
              description,
              years: extra,
            })
          }
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="Products are fitted by model, so no products are affected."
        onConfirm={() => deleting && deleteSubModel(make.id, model.id, deleting.id)}
      />
    </>
  );
}
