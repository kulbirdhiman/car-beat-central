"use client";

import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { newId, slugify, useAdminStore } from "@/components/admin/AdminStore";
import { SortableTable } from "@/components/admin/SortableTable";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Empty, Field, PageHeader, fmtDate } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Department } from "@/lib/admin/model";

const TOP_LEVEL = "none";

/** Top-level departments, or with `parentId` the sub-departments of one department (e.g. Satnav Car Stereos under Car Stereos). */
export function DepartmentsManager({ parentId = null }: { parentId?: string | null }) {
  const { departments, products, deleteDepartment, reorderDepartments } = useAdminStore();
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const parent = parentId === null ? null : departments.find((d) => d.id === parentId);
  if (parentId !== null && !parent) {
    return (
      <Empty>
        That department doesn&apos;t exist (it may have been deleted).{" "}
        <Link href="/admin/departments" className="underline">
          Back to departments
        </Link>
      </Empty>
    );
  }

  const rows = departments.filter((d) => d.parentId === parentId);
  const children = (id: string) => departments.filter((d) => d.parentId === id);
  const productCount = (id: string) => products.filter((p) => p.departmentId === id).length;
  // A department's count includes its sub-departments' products.
  const totalCount = (id: string) => productCount(id) + children(id).reduce((n, c) => n + productCount(c.id), 0);
  const deletingCount = deleting ? totalCount(deleting.id) : 0;
  const deletingSubs = deleting ? children(deleting.id).length : 0;

  return (
    <>
      {parent && (
        <Link href="/admin/departments" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> All departments
        </Link>
      )}
      <PageHeader
        title={parent ? `${parent.name}: sub-departments` : "Departments"}
        description={
          parent
            ? `Narrower groups inside ${parent.name}, such as Satnav or Linux stereos. Shoppers see them under the category in the shop filters. Drag rows to reorder.`
            : "Product types such as Car Stereos or Audio Equipment. Open one to add sub-departments. Drag rows to set the order they appear in the store."
        }
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus /> {parent ? "Add sub-department" : "Add department"}
          </Button>
        }
      />

      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <Empty>{parent ? `No sub-departments in ${parent.name} yet.` : "No departments yet."}</Empty>
          ) : (
            <SortableTable
              rows={rows}
              onReorder={reorderDepartments}
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
                ...(parent
                  ? []
                  : [
                      {
                        header: "Sub-departments",
                        className: "hidden sm:table-cell",
                        cell: (d: Department) => (
                          <Link href={`/admin/departments/${d.id}`} className="inline-flex items-center gap-0.5 text-sm hover:underline">
                            {children(d.id).length || "Add"}
                            <ChevronRight className="size-3.5" />
                          </Link>
                        ),
                      },
                    ]),
                { header: "Products", className: "text-right tabular-nums", cell: (d) => totalCount(d.id) },
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

      {editing && (
        <DepartmentDialog
          key={editing === "new" ? "new" : editing.id}
          department={editing === "new" ? null : editing}
          defaultParentId={parentId}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting?.parentId ? "Delete sub-department?" : "Delete department?"}
        description={[
          `"${deleting?.name}" will be removed`,
          deletingSubs > 0 ? ` along with its ${deletingSubs} sub-department${deletingSubs === 1 ? "" : "s"}.` : ".",
          deletingCount > 0 ? ` ${deletingCount} product${deletingCount === 1 ? "" : "s"} will show as Unassigned until you move them to another department.` : "",
        ].join("")}
        onConfirm={() => deleting && deleteDepartment(deleting.id)}
      />
    </>
  );
}

function DepartmentDialog({ department, defaultParentId, onClose }: { department: Department | null; defaultParentId: string | null; onClose: () => void }) {
  const { departments, saveDepartment } = useAdminStore();
  const [parentId, setParentId] = useState(department ? department.parentId : defaultParentId);
  // Only one level of nesting: a department with sub-departments stays top-level.
  const hasChildren = !!department && departments.some((d) => d.parentId === department.id);
  const parents = departments.filter((d) => d.parentId === null && d.id !== department?.id);
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
      parentId,
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
          <DialogTitle>{department ? "Edit department" : parentId ? "Add sub-department" : "Add department"}</DialogTitle>
          <DialogDescription>Departments group products by type. Sub-departments split one further, e.g. Satnav Car Stereos under Car Stereos.</DialogDescription>
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
              placeholder={parentId ? "e.g. Satnav Car Stereos" : "e.g. Audio Equipment"}
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field id="df-parent" label="Sits under">
            <Select value={parentId ?? TOP_LEVEL} onValueChange={(v) => setParentId(v === TOP_LEVEL ? null : v)} disabled={hasChildren}>
              <SelectTrigger id="df-parent" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TOP_LEVEL}>Nothing (top-level department)</SelectItem>
                {parents.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasChildren && <p className="text-xs text-muted-foreground">This department has sub-departments, so it stays top-level.</p>}
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
          <Field id="df-image" label="Banner image">
            <ImageUpload id="df-image" folder="departments" value={image} onChange={setImage} />
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
