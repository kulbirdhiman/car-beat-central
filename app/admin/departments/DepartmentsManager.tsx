"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { newId, slugify, useAdminStore } from "@/components/admin/AdminStore";
import { SortableTable } from "@/components/admin/SortableTable";
import { Empty, Field, PageHeader, fmtDate } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Department } from "@/lib/admin/mock-data";

export function DepartmentsManager() {
  const { departments, products, deleteDepartment, setDepartments } = useAdminStore();
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const productCount = (id: string) => products.filter((p) => p.departmentId === id).length;
  const deletingCount = deleting ? productCount(deleting.id) : 0;

  return (
    <>
      <PageHeader
        title="Departments"
        description="Product types such as Car Stereos or Audio Equipment. Drag rows to set the order they appear in the store."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add department
          </Button>
        }
      />

      <Card>
        <CardContent>
          {departments.length === 0 ? (
            <Empty>No departments yet.</Empty>
          ) : (
            <SortableTable
              rows={departments}
              onReorder={setDepartments}
              rowLabel={(d) => d.name}
              columns={[
                {
                  header: "Department",
                  cell: (d) => (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.image} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                      <div className="min-w-0">
                        <Link href={`/admin/products?department=${d.id}`} className="font-medium hover:underline">
                          {d.name}
                        </Link>
                        <div className="font-mono text-xs text-muted-foreground">/shop/{d.slug}</div>
                      </div>
                    </div>
                  ),
                },
                { header: "Description", className: "hidden max-w-80 whitespace-normal text-muted-foreground md:table-cell", cell: (d) => d.description || "—" },
                { header: "Products", className: "text-right tabular-nums", cell: (d) => productCount(d.id) },
                {
                  header: "Status",
                  className: "hidden sm:table-cell",
                  cell: (d) => <Badge variant={d.active ? "secondary" : "outline"}>{d.active ? "Visible" : "Hidden"}</Badge>,
                },
                { header: "Created", className: "hidden whitespace-nowrap text-muted-foreground lg:table-cell", cell: (d) => fmtDate(d.createdAt) },
                {
                  header: <span className="sr-only">Actions</span>,
                  className: "w-20",
                  cell: (d) => (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(d)} aria-label={`Edit ${d.name}`}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(d)} aria-label={`Delete ${d.name}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {editing && <DepartmentDialog key={editing === "new" ? "new" : editing.id} department={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete department?"
        description={
          deletingCount > 0
            ? `"${deleting?.name}" has ${deletingCount} products. They'll show as Unassigned until you move them to another department.`
            : `"${deleting?.name}" will be removed.`
        }
        onConfirm={() => deleting && deleteDepartment(deleting.id)}
      />
    </>
  );
}

function DepartmentDialog({ department, onClose }: { department: Department | null; onClose: () => void }) {
  const { departments, saveDepartment } = useAdminStore();
  const [name, setName] = useState(department?.name ?? "");
  const [slug, setSlug] = useState(department?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!department);
  const [description, setDescription] = useState(department?.description ?? "");
  const [image, setImage] = useState(department?.image ?? "/images/trunk-audio.jpg");
  const [active, setActive] = useState(department?.active ?? true);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Enter a name.";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) next.slug = "Lowercase letters, numbers and dashes.";
    else if (departments.some((d) => d.slug === slug && d.id !== department?.id)) next.slug = "Another department uses this URL.";
    setErrors(next);
    if (Object.keys(next).length) return;

    saveDepartment({
      id: department?.id ?? newId("d"),
      name: name.trim(),
      slug,
      description: description.trim(),
      image: image.trim(),
      active,
      createdAt: department?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{department ? "Edit department" : "Add department"}</DialogTitle>
          <DialogDescription>Departments group products by type.</DialogDescription>
        </DialogHeader>
        <form id="department-form" onSubmit={submit} className="grid gap-4" noValidate>
          <Field id="df-name" label="Name" error={errors.name}>
            <Input
              id="df-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Audio Equipment"
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field id="df-slug" label="URL slug" error={errors.slug}>
            <Input
              id="df-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="font-mono"
              aria-invalid={!!errors.slug}
            />
          </Field>
          <Field id="df-description" label="Description">
            <Textarea id="df-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </Field>
          <Field id="df-image" label="Banner image path or URL">
            <Input id="df-image" value={image} onChange={(e) => setImage(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} />
            Show in store navigation
          </label>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="department-form">
            {department ? "Save changes" : "Add department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
