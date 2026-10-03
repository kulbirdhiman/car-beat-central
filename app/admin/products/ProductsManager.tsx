"use client";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Empty, PageHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LOW_STOCK, type AdminProduct, type VehicleMake } from "@/lib/admin/mock-data";
import { formatPrice } from "@/lib/data";
import { ProductDialog } from "./ProductDialog";

const ALL = "all";

/** "Universal", or e.g. "BMW 3 Series, X5 · Toyota HiLux". */
export function fitsSummary(fits: AdminProduct["fits"], makes: VehicleMake[]) {
  if (fits === "universal") return "Universal";
  const parts = makes.flatMap((make) => {
    const names = make.models.filter((m) => fits.includes(m.id)).map((m) => m.name);
    return names.length ? [`${make.name} ${names.join(", ")}`] : [];
  });
  return parts.length ? parts.join(" · ") : "No vehicles";
}

export function ProductsManager() {
  const { products, departments, makes, deleteProduct } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  // ?department=id preselects the filter (linked from the Departments table).
  const [department, setDepartment] = useState(() => {
    const id = searchParams.get("department");
    return id && departments.some((d) => d.id === id) ? id : ALL;
  });
  const [make, setMake] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);

  // The product being edited lives in the URL (?edit=id) so dashboard links can open it directly.
  const editing = products.find((p) => p.id === searchParams.get("edit")) ?? null;
  const setEditing = (p: AdminProduct | null) => router.replace(p ? `${pathname}?edit=${p.id}` : pathname, { scroll: false });

  const makeModels = new Set(makes.find((m) => m.id === make)?.models.map((m) => m.id));
  const q = query.trim().toLowerCase();
  const rows = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) &&
      (department === ALL || p.departmentId === department) &&
      (status === ALL || p.status === status) &&
      (make === ALL || p.fits === "universal" || p.fits.some((id) => makeModels.has(id))),
  );

  const departmentName = (id: string) => departments.find((d) => d.id === id)?.name ?? "Unassigned";

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} products across ${departments.length} departments.`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Add product
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, SKU or brand" className="pl-8" aria-label="Search products" />
            </div>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-48" aria-label="Filter by department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={make} onValueChange={setMake}>
              <SelectTrigger className="w-44" aria-label="Filter by vehicle make">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All vehicles</SelectItem>
                {makes.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    Fits {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <Empty>No products match these filters.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Fits</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                        <div className="min-w-0">
                          <div className="max-w-36 truncate font-medium sm:max-w-72">{p.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{departmentName(p.departmentId)}</TableCell>
                    <TableCell className="hidden max-w-64 truncate text-muted-foreground lg:table-cell" title={fitsSummary(p.fits, makes)}>
                      {fitsSummary(p.fits, makes)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div>{formatPrice(p.price)}</div>
                      {p.rrp > p.price && <div className="text-xs text-muted-foreground line-through">{formatPrice(p.rrp)}</div>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={p.stock === 0 ? "font-medium text-destructive" : p.stock <= LOW_STOCK ? "text-amber-700 dark:text-amber-400" : undefined}>
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "secondary" : "outline"}>{p.status === "active" ? "Active" : "Draft"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}>
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <ProductDialog
          key={editing?.id ?? "new"}
          product={editing}
          onClose={() => (editing ? setEditing(null) : setCreating(false))}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete product?"
        description={`"${deleting?.name}" will be removed from the catalogue.`}
        onConfirm={() => deleting && deleteProduct(deleting.id)}
      />
    </>
  );
}
