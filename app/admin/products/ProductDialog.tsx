"use client";

import { useState } from "react";
import { newId, useAdminStore } from "@/components/admin/AdminStore";
import { ModelPicker } from "@/components/admin/Pickers";
import { Field } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { departmentTree, type AdminProduct } from "@/lib/admin/model";
import { CATEGORY_LABELS } from "@/lib/data";
import type { Category } from "@/lib/types";

type Errors = Partial<Record<"name" | "sku" | "brand" | "departmentId" | "category" | "price" | "rrp" | "stock" | "image" | "fits", string>>;

export function ProductDialog({ product, onClose }: { product: AdminProduct | null; onClose: () => void }) {
  const { departments, makes, saveProduct } = useAdminStore();
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    brand: product?.brand ?? "",
    departmentId: product?.departmentId ?? "",
    category: product?.category ?? "",
    price: product ? String(product.price) : "",
    rrp: product ? String(product.rrp) : "",
    stock: product ? String(product.stock) : "0",
    status: product?.status ?? "draft",
    image: product?.image ?? "/images/stereo-android.jpg",
    description: product?.description ?? "",
  });
  const [universal, setUniversal] = useState(product?.fits === "universal");
  const [models, setModels] = useState<Set<string>>(new Set(product && product.fits !== "universal" ? product.fits : []));
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    const rrp = Number(form.rrp || form.price);
    const stock = Number(form.stock);
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Enter a product name.";
    if (!form.sku.trim()) next.sku = "Enter a SKU.";
    if (!form.brand.trim()) next.brand = "Enter a brand.";
    if (!form.departmentId) next.departmentId = "Choose a department.";
    if (!form.category) next.category = "Choose a store category.";
    if (!Number.isInteger(price) || price <= 0) next.price = "Whole dollars, above 0.";
    if (!Number.isInteger(rrp) || rrp < price) next.rrp = "RRP can't be below the price.";
    if (!Number.isInteger(stock) || stock < 0) next.stock = "0 or more.";
    if (!form.image.trim()) next.image = "Add an image path or URL.";
    if (!universal && models.size === 0) next.fits = "Pick at least one model, or mark it universal.";
    setErrors(next);
    if (Object.keys(next).length) return;

    saveProduct({
      id: product?.id ?? newId("p"),
      // New products get their store URL from the server.
      slug: product?.slug ?? "",
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      brand: form.brand.trim(),
      departmentId: form.departmentId,
      category: form.category as Category,
      price,
      rrp,
      stock,
      status: form.status as AdminProduct["status"],
      image: form.image.trim(),
      description: form.description.trim(),
      fits: universal ? "universal" : [...models],
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>Prices are whole AUD, GST inclusive.</DialogDescription>
        </DialogHeader>

        <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field id="pf-name" label="Name" error={errors.name} className="sm:col-span-2">
            <Input id="pf-name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
          </Field>
          <Field id="pf-sku" label="SKU" error={errors.sku}>
            <Input id="pf-sku" value={form.sku} onChange={set("sku")} className="font-mono uppercase" aria-invalid={!!errors.sku} />
          </Field>
          <Field id="pf-brand" label="Brand" error={errors.brand}>
            <Input id="pf-brand" value={form.brand} onChange={set("brand")} aria-invalid={!!errors.brand} />
          </Field>
          <Field id="pf-department" label="Department" error={errors.departmentId}>
            <Select value={form.departmentId} onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}>
              <SelectTrigger id="pf-department" className="w-full" aria-invalid={!!errors.departmentId}>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {departmentTree(departments).map((d) => (
                  <SelectItem key={d.id} value={d.id} className={d.depth ? "pl-6" : undefined}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="pf-category" label="Store category" error={errors.category}>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger id="pf-category" className="w-full" aria-invalid={!!errors.category}>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="pf-status" label="Status">
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as AdminProduct["status"] }))}>
              <SelectTrigger id="pf-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active (visible in store)</SelectItem>
                <SelectItem value="draft">Draft (hidden)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <Field id="pf-price" label="Price ($)" error={errors.price}>
              <Input id="pf-price" inputMode="numeric" value={form.price} onChange={set("price")} aria-invalid={!!errors.price} />
            </Field>
            <Field id="pf-rrp" label="RRP ($)" error={errors.rrp}>
              <Input id="pf-rrp" inputMode="numeric" value={form.rrp} onChange={set("rrp")} placeholder="Same as price" aria-invalid={!!errors.rrp} />
            </Field>
            <Field id="pf-stock" label="Stock" error={errors.stock}>
              <Input id="pf-stock" inputMode="numeric" value={form.stock} onChange={set("stock")} aria-invalid={!!errors.stock} />
            </Field>
          </div>
          <Field id="pf-image" label="Image path or URL" error={errors.image} className="sm:col-span-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {form.image && <img src={form.image} alt="" className="size-10 shrink-0 rounded-md object-cover" />}
              <Input id="pf-image" value={form.image} onChange={set("image")} aria-invalid={!!errors.image} />
            </div>
          </Field>
          <Field id="pf-description" label="Description" className="sm:col-span-2">
            <Textarea id="pf-description" value={form.description} onChange={set("description")} rows={3} />
          </Field>

          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">Vehicle fitment</legend>
            <label className="mb-3 flex items-center gap-2 text-sm">
              <Checkbox checked={universal} onCheckedChange={(v) => setUniversal(v === true)} />
              Universal: fits every vehicle
            </label>
            {!universal && <ModelPicker makes={makes} value={models} onChange={setModels} />}
            {errors.fits && <p className="mt-2 text-xs text-destructive">{errors.fits}</p>}
          </fieldset>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="product-form">
            {product ? "Save changes" : "Add product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
