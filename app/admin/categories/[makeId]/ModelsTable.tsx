"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { idFrom, useAdminStore, vehicles } from "@/components/admin/AdminStore";
import { RowActions } from "@/components/admin/RowActions";
import { SortableTable } from "@/components/admin/SortableTable";
import { Empty, PageHeader, fmtDate } from "@/components/admin/ui";
import { VehicleBreadcrumb } from "@/components/admin/VehicleBreadcrumb";
import { VehicleDialog } from "@/components/admin/VehicleDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VehicleModel } from "@/lib/admin/mock-data";

export function ModelsTable({ makeId }: { makeId: string }) {
  const { makes, products, setMakes } = useAdminStore();
  const [editing, setEditing] = useState<VehicleModel | "new" | null>(null);
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
  const fitted = (modelId: string) => products.filter((p) => p.fits !== "universal" && p.fits.includes(modelId)).length;
  const allModelIds = makes.flatMap((m) => m.models.map((x) => x.id));

  return (
    <>
      <VehicleBreadcrumb trail={[{ label: make.name, href: base }]} />
      <PageHeader
        title={`${make.name} models`}
        description={make.description || "Click a model to see its sub-models. Drag rows to reorder."}
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
              onReorder={(rows) => setMakes((list) => vehicles.updateMake(list, make.id, (m) => ({ ...m, models: rows })))}
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
                    <Link href={`${base}/${m.id}`} className="hover:underline">
                      {m.subModels.length}
                    </Link>
                  ),
                },
                { header: "Products fitted", className: "hidden text-right tabular-nums sm:table-cell", cell: (m) => fitted(m.id) },
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
            setMakes((list) =>
              editing === "new"
                ? vehicles.updateMake(list, make.id, (m) => ({
                    ...m,
                    models: [
                      ...m.models,
                      { id: idFrom(`${make.id}-${name}`, allModelIds), name, description, createdAt: new Date().toISOString(), subModels: [] },
                    ],
                  }))
                : vehicles.updateModel(list, make.id, editing.id, (m) => ({ ...m, name, description })),
            )
          }
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${make.name} ${deleting?.name}?`}
        description={`This also deletes its ${deleting?.subModels.length ?? 0} sub-models.${
          deleting && fitted(deleting.id) ? ` ${fitted(deleting.id)} products are fitted to this model and will lose that fitment.` : ""
        }`}
        onConfirm={() =>
          deleting && setMakes((list) => vehicles.updateMake(list, make.id, (m) => ({ ...m, models: m.models.filter((x) => x.id !== deleting.id) })))
        }
      />
    </>
  );
}
