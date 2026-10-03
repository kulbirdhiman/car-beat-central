"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { idFrom, useAdminStore, vehicles } from "@/components/admin/AdminStore";
import { RowActions } from "@/components/admin/RowActions";
import { SortableTable } from "@/components/admin/SortableTable";
import { Empty, PageHeader, fmtDate } from "@/components/admin/ui";
import { VehicleDialog } from "@/components/admin/VehicleDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VehicleMake } from "@/lib/admin/mock-data";

export function MakesTable() {
  const { makes, setMakes } = useAdminStore();
  const [editing, setEditing] = useState<VehicleMake | "new" | null>(null);
  const [deleting, setDeleting] = useState<VehicleMake | null>(null);

  const subModelCount = (m: VehicleMake) => m.models.reduce((n, x) => n + x.subModels.length, 0);

  return (
    <>
      <PageHeader
        title="Vehicle Categories"
        description="Makes, their models and sub-models. Click a make to see its models. Drag rows to reorder."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add make
          </Button>
        }
      />

      <Card>
        <CardContent>
          {makes.length === 0 ? (
            <Empty>No makes yet.</Empty>
          ) : (
            <SortableTable
              rows={makes}
              onReorder={(rows) => setMakes(() => rows)}
              rowLabel={(m) => m.name}
              columns={[
                {
                  header: "Make",
                  cell: (m) => (
                    <Link href={`/admin/categories/${m.id}`} className="font-medium hover:underline">
                      {m.name}
                    </Link>
                  ),
                },
                { header: "Description", className: "hidden max-w-96 whitespace-normal text-muted-foreground md:table-cell", cell: (m) => m.description || "—" },
                { header: "Country", className: "hidden sm:table-cell", cell: (m) => m.country || "—" },
                {
                  header: "Models",
                  className: "text-right tabular-nums",
                  cell: (m) => (
                    <Link href={`/admin/categories/${m.id}`} className="hover:underline">
                      {m.models.length}
                    </Link>
                  ),
                },
                { header: "Sub-models", className: "hidden text-right tabular-nums lg:table-cell", cell: subModelCount },
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
          level="make"
          initial={editing === "new" ? undefined : { name: editing.name, description: editing.description, extra: editing.country }}
          onClose={() => setEditing(null)}
          onSave={({ name, description, extra }) =>
            editing === "new"
              ? setMakes((list) => [
                  ...list,
                  { id: idFrom(name, list.map((m) => m.id)), name, description, country: extra, createdAt: new Date().toISOString(), models: [] },
                ])
              : setMakes((list) => vehicles.updateMake(list, editing.id, (m) => ({ ...m, name, description, country: extra })))
          }
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description={`This also deletes its ${deleting?.models.length ?? 0} models and their sub-models. Products fitted to them will lose that fitment.`}
        onConfirm={() => deleting && setMakes((list) => list.filter((m) => m.id !== deleting.id))}
      />
    </>
  );
}
