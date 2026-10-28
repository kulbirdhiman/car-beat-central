"use client";

import { fitmentLabel } from "@/lib/fitment-years";
import { Copy, Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { newId, useAdminStore } from "@/components/admin/AdminStore";
import { Empty, PageHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { departmentLabel, departmentTree, LOW_STOCK, type AdminProduct, type VehicleMake } from "@/lib/admin/model";
import { CATEGORY_LABELS, formatPrice } from "@/lib/data";
import type { Category } from "@/lib/types";

const ALL = "all";
const PRODUCT_COLUMNS = ["id", "sku", "name", "brand", "departmentId", "category", "price", "rrp", "stock", "status", "fits", "image", "images", "description", "badge", "features", "specs", "addOnIds", "dealPrice", "trending", "keywords", "optionGroups", "fitmentYears"] as const;

function parseCsv(source: string) {
  const text = source.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell.length === 0) quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (quoted) throw new Error("The CSV has an unclosed quoted field.");
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one product row.");
  const headers = rows[0].map((value) => value.trim());
  const missing = PRODUCT_COLUMNS.filter((column) => !["keywords", "optionGroups"].includes(column) && !headers.includes(column));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}. Export products first to get the right template.`);
  return rows.slice(1).map((values, index) => ({
    rowNumber: index + 2,
    fields: Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""])),
  }));
}

function csvList(value: string, field: string): string[] {
  if (!value.trim()) return [];
  if (value.trim().startsWith("[")) {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((part) => typeof part !== "string")) throw new Error(`${field} must be a JSON list of text values.`);
    return parsed;
  }
  return value.split("|").map((part) => part.trim()).filter(Boolean);
}

function importProduct(fields: Record<string, string>): AdminProduct {
  const image = fields.image.trim();
  let specs: [string, string][] = [];
  if (fields.specs.trim()) {
    const parsed: unknown = JSON.parse(fields.specs);
    if (!Array.isArray(parsed) || parsed.some((spec) => !Array.isArray(spec) || spec.length !== 2 || spec.some((part) => typeof part !== "string"))) {
      throw new Error("specs must be a JSON list of [name, value] pairs.");
    }
    specs = parsed as [string, string][];
  }
  const category = fields.category.trim() as Category;
  if (!(category in CATEGORY_LABELS)) throw new Error(`category must be one of: ${Object.keys(CATEGORY_LABELS).join(", ")}.`);
  const number = (key: string, fallback = "0") => {
    const value = fields[key].trim() || fallback;
    if (!/^\d+$/.test(value)) throw new Error(`${key} must be a whole number.`);
    return Number(value);
  };
  const fitsValue = fields.fits.trim();
  const fits: AdminProduct["fits"] = fitsValue.toLowerCase() === "universal" ? "universal" : csvList(fitsValue, "fits");
  const images = csvList(fields.images, "images");
  const status = fields.status.trim();
  if (status && status !== "active" && status !== "draft") throw new Error("status must be active or draft.");
  const parseJson = (key: string) => {
    if (!fields[key]?.trim()) return [];
    const parsed: unknown = JSON.parse(fields[key]);
    if (!Array.isArray(parsed)) throw new Error(`${key} must be a JSON list.`);
    return parsed;
  };
  return {
    id: fields.id.trim() || newId("p"), slug: "", sku: fields.sku.trim(), name: fields.name.trim(), brand: fields.brand.trim(),
    departmentId: fields.departmentId.trim(), category, price: number("price"), rrp: number("rrp", fields.price), stock: number("stock"),
    status: status === "active" ? "active" : "draft", fits, fitmentYears: fields.fitmentYears?.trim() ? JSON.parse(fields.fitmentYears) : {}, image, images: images.length ? images : image ? [image] : [],
    description: fields.description, badge: fields.badge.trim(), features: csvList(fields.features, "features"), keywords: csvList(fields.keywords ?? "", "keywords"), specs,
    optionGroups: parseJson("optionGroups") as AdminProduct["optionGroups"],
    addOnIds: csvList(fields.addOnIds, "addOnIds"), dealPrice: fields.dealPrice.trim() ? number("dealPrice") : null,
    trending: ["true", "yes", "1"].includes(fields.trending.trim().toLowerCase()), rating: 0, reviews: 0,
  };
}

/** "Universal", or e.g. "BMW 3 Series, X5 · Toyota HiLux". */
export function fitsSummary(fits: AdminProduct["fits"], makes: VehicleMake[], fitmentYears?: AdminProduct["fitmentYears"]) {
  if (fits === "universal") return "Universal";
  const parts = makes.flatMap((make) => {
    const names = make.models.flatMap((m) => {
      return [
        ...(fits.includes(m.id) ? [fitmentLabel({ fitmentYears }, m.id, m.name)] : []),
        ...m.subModels.filter((s) => fits.includes(s.id)).map((s) => fitmentLabel({ fitmentYears }, s.id, `${m.name} ${s.name}`)),
      ];
    });
    return names.length ? [`${make.name} ${names.join(", ")}`] : [];
  });
  return parts.length ? parts.join(" · ") : "No vehicles";
}

export function ProductsManager() {
  const { products, departments, makes, deleteProduct, importProducts } = useAdminStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const [query, setQuery] = useState("");
  // ?department=id preselects the filter (linked from the Departments table).
  const [department, setDepartment] = useState(() => {
    const id = searchParams.get("department");
    return id && departments.some((d) => d.id === id) ? id : ALL;
  });
  const [make, setMake] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const makeModels = new Set(makes.find((m) => m.id === make)?.models.flatMap((m) => [m.id, ...m.subModels.map((s) => s.id)]));
  const q = query.trim().toLowerCase();
  const rows = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.keywords.some((keyword) => keyword.toLowerCase().includes(q))) &&
      // Filtering by a department includes its sub-departments.
      (department === ALL || p.departmentId === department || departments.some((d) => d.id === p.departmentId && d.parentId === department)) &&
      (status === ALL || p.status === status) &&
      (make === ALL || p.fits === "universal" || p.fits.some((id) => makeModels.has(id))),
  );

  const departmentName = (id: string) => departmentLabel(departments, id) ?? "Unassigned";

  async function duplicateProduct(product: AdminProduct) {
    const takenSkus = new Set(products.map((item) => item.sku.toUpperCase()));
    let suffix = "-COPY";
    let sku = "";
    for (let n = 2; ; n++) {
      sku = `${product.sku.slice(0, 40 - suffix.length)}${suffix}`.toUpperCase();
      if (!takenSkus.has(sku)) break;
      suffix = `-COPY-${n}`;
    }
    const duplicate: AdminProduct = {
      ...product,
      id: newId("p"),
      slug: "",
      sku,
      name: `Copy of ${product.name}`.slice(0, 120),
      status: "draft",
      stock: 0,
      images: [...product.images],
      features: [...product.features],
      keywords: [...product.keywords],
      optionGroups: product.optionGroups.map((group) => ({ ...group, values: group.values.map((choice) => ({ ...choice })) })),
      specs: product.specs.map(([label, value]) => [label, value] as [string, string]),
      addOnIds: [...product.addOnIds],
      dealPrice: null,
      trending: false,
      rating: 0,
      reviews: 0,
    };

    setDuplicating(product.id);
    try {
      const [result] = await importProducts([duplicate]);
      if (result.error) throw new Error(result.error);
      toast.success("Draft copy created. Review it before publishing.");
      router.push(`/admin/products/${encodeURIComponent(result.id)}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't duplicate this product.");
    } finally {
      setDuplicating(null);
    }
  }

  function exportCsv() {
    const csvCell = (value: string | number | boolean | null) => {
      let text = value === null ? "" : String(value);
      if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const csv = [PRODUCT_COLUMNS, ...products.map((p) => [
      p.id, p.sku, p.name, p.brand, p.departmentId, p.category, p.price, p.rrp, p.stock, p.status,
      p.fits === "universal" ? "universal" : JSON.stringify(p.fits), p.image, JSON.stringify(p.images), p.description, p.badge,
      JSON.stringify(p.features), JSON.stringify(p.specs), JSON.stringify(p.addOnIds), p.dealPrice, p.trending, JSON.stringify(p.keywords), JSON.stringify(p.optionGroups), JSON.stringify(p.fitmentYears ?? {}),
    ])].map((line) => line.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = Object.assign(document.createElement("a"), { href: url, download: `carbeat-products-${new Date().toISOString().slice(0, 10)}.csv` });
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length > 500) throw new Error("Import up to 500 products at a time.");
      const failures: string[] = [];
      const valid: { rowNumber: number; product: AdminProduct }[] = [];
      for (const row of parsed) {
        try { valid.push({ rowNumber: row.rowNumber, product: importProduct(row.fields) }); }
        catch (error) { failures.push(`Row ${row.rowNumber}: ${error instanceof Error ? error.message : "Invalid product."}`); }
      }
      if (valid.length === 0) {
        toast.error(failures[0] ?? "No valid products found in the CSV.");
        return;
      }
      const updates = valid.filter(({ product }) => products.some((existing) => existing.id === product.id)).length;
      const creates = valid.length - updates;
      if (!confirm(`Import ${creates} new product${creates === 1 ? "" : "s"} and update ${updates} existing product${updates === 1 ? "" : "s"}?`)) return;
      const saved = await importProducts(valid.map((row) => row.product));
      saved.forEach((result, index) => {
        if (result.error) failures.push(`Row ${valid[index].rowNumber}: ${result.error}`);
      });
      const succeeded = saved.filter((result) => !result.error).length;
      if (succeeded) toast.success(`${succeeded} product${succeeded === 1 ? "" : "s"} imported.`);
      if (failures.length) toast.error(`${failures.length} row${failures.length === 1 ? "" : "s"} skipped. ${failures.slice(0, 2).join(" ")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read the products CSV.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} products across ${departments.length} departments. Import CSV, or download the Excel demo and save it as CSV first. Blank IDs create products; matching IDs update them.`}
        actions={
          <>
            <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} aria-label="Import products CSV" />
            <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={importing}><Upload /> {importing ? "Importing…" : "Import CSV"}</Button>
            <Button asChild variant="outline"><a href="/templates/products-import-demo.xlsx" download><Download /> Demo Excel</a></Button>
            <Button variant="outline" onClick={exportCsv} disabled={!products.length}><Download /> Export CSV</Button>
            <Button asChild><Link href="/admin/products/new"><Plus /> Add product</Link></Button>
          </>
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
                {departmentTree(departments).map((d) => (
                  <SelectItem key={d.id} value={d.id} className={d.depth ? "pl-6" : undefined}>
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
                          <Link href={`/admin/products/${p.id}/edit`} className="block max-w-36 truncate font-medium hover:underline sm:max-w-72">
                            {p.name}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{departmentName(p.departmentId)}</TableCell>
                    <TableCell className="hidden max-w-64 truncate text-muted-foreground lg:table-cell" title={fitsSummary(p.fits, makes, p.fitmentYears)}>
                      {fitsSummary(p.fits, makes, p.fitmentYears)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div>{formatPrice(p.price)}</div>
                      {p.dealPrice !== null ? (
                        <div className="text-xs font-medium text-destructive">Deal {formatPrice(p.dealPrice)}</div>
                      ) : (
                        p.rrp > p.price && <div className="text-xs text-muted-foreground line-through">{formatPrice(p.rrp)}</div>
                      )}
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
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/admin/products/${p.id}/edit`} aria-label={`Edit ${p.name}`}>
                            <Pencil />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => void duplicateProduct(p)} disabled={duplicating !== null} aria-label={`Duplicate ${p.name}`} title="Duplicate as draft">
                          <Copy />
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
