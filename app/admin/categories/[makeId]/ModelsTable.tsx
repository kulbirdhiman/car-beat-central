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
import type { SubModel, VehicleModel } from "@/lib/admin/model";

export function ModelsTable({ makeId }: { makeId: string }) {
  const { makes, products, saveModel, saveSubModel, deleteModel, reorderModels } = useAdminStore();
  const [editing, setEditing] = useState<VehicleModel | "new" | null>(null);
  const [addingSubModel, setAddingSubModel] = useState<VehicleModel | null>(null);
  const [deleting, setDeleting] = useState<VehicleModel | null>(null);

  const make = makes.find((m) => m.id === makeId);
  if (!make) {
    return (
      <>
        <VehicleBreadcrumb trail={[{ label: "Not found", href: `/admin/categories/${makeId}` }]} />
        <Empty>
          That make doesn&apos;t exist (it may have been deleted).{" "}
          <Link href="/admin/categories" className="underline">
            Back to makes
          </Link>
        </Empty>
      </>
    );
  }

  const base = `/admin/categories/${make.id}`;
  const fitted = (model: VehicleModel) => products.filter((p) => p.fits !== "universal" && (p.fits.includes(model.id) || model.subModels.some((s) => p.fits.includes(s.id)))).length;
  const allModelIds = makes.flatMap((m) => m.models.map((x) => x.id));
  const allSubIds = makes.flatMap((m) => m.models.flatMap((x) => x.subModels.map((s) => s.id)));

  return (
    <>
      <VehicleBreadcrumb trail={[{ label: make.name, href: base }]} />
      <PageHeader
        title={`${make.name} models`}
        description={make.description || "Add models and their sub-models here. Open a model to manage its full list."}
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add model
          </Button>
        }
      />

      <Card>
        <CardContent>
          {make.models.length === 0 ? (
            <Empty>No models for {make.name} yet.</Empty>
          ) : (
            <SortableTable
              rows={make.models}
              onReorder={(rows) => reorderModels(make.id, rows)}
              rowLabel={(m) => `${make.name} ${m.name}`}
              columns={[
                {
                  header: "Model",
                  cell: (m) => (
                    <Link href={`${base}/${m.id}`} className="font-medium hover:underline">
                      {m.name}
                    </Link>
                  ),
                },
                { header: "Description", className: "hidden max-w-96 whitespace-normal text-muted-foreground md:table-cell", cell: (m) => m.description || "—" },
                {
                  header: "Sub-models",
                  className: "text-right tabular-nums",
                  cell: (m) => (
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`${base}/${m.id}`} className="min-w-5 text-right hover:underline" aria-label={`${m.subModels.length} sub-models for ${m.name}`}>
                        {m.subModels.length}
                      </Link>
                      <Button type="button" size="sm" variant="outline" onClick={() => setAddingSubModel(m)}>
                        <Plus /> <span className="hidden xl:inline">Add sub-model</span><span className="xl:hidden">Add</span>
                      </Button>
                    </div>
                  ),
                },
                { header: "Products fitted", className: "hidden text-right tabular-nums sm:table-cell", cell: (m) => fitted(m) },
                { header: "Created", className: "hidden whitespace-nowrap text-muted-foreground lg:table-cell", cell: (m) => fmtDate(m.createdAt) },
                {
                  header: <span className="sr-only">Actions</span>,
                  className: "w-20",
                  cell: (m) => <RowActions label={m.name} onEdit={() => setEditing(m)} onDelete={() => setDeleting(m)} />,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {editing && (
        <VehicleDialog
          level="model"
          parent={make.name}
          initial={editing === "new" ? undefined : { name: editing.name, description: editing.description, extra: "" }}
          onClose={() => setEditing(null)}
          onSave={({ name, description }) =>
            saveModel(make.id, { id: editing === "new" ? idFrom(`${make.id}-${name}`, allModelIds) : editing.id, name, description })
          }
        />
      )}

      {addingSubModel && (
        <VehicleDialog
          level="subModel"
          parent={`${make.name} ${addingSubModel.name}`}
          onClose={() => setAddingSubModel(null)}
          onSave={({ name, description, extra }) => {
            const sub: SubModel = {
              id: idFrom(`${addingSubModel.id}-${name}`, allSubIds),
              name,
              description,
              years: extra,
              createdAt: new Date().toISOString(),
            };
            saveSubModel(make.id, addingSubModel.id, sub);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${make.name} ${deleting?.name}?`}
        description={`This also deletes its ${deleting?.subModels.length ?? 0} sub-models.${
          deleting && fitted(deleting) ? ` ${fitted(deleting)} products are fitted to this model and will lose that fitment.` : ""
        }`}
        onConfirm={() => deleting && deleteModel(make.id, deleting.id)}
      />
    </>
  );
}
