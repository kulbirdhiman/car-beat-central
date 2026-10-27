"use client";

import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { newId, useAdminStore } from "@/components/admin/AdminStore";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichDescriptionEditor } from "@/components/admin/RichDescriptionEditor";
import { ModelPicker, ProductPicker } from "@/components/admin/Pickers";
import { Field, PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { departmentTree, type AdminProduct } from "@/lib/admin/model";
import { CATEGORY_LABELS } from "@/lib/data";
import { productDescriptionText } from "@/lib/product-description";
import type { Category } from "@/lib/types";

type Errors = Partial<Record<"name" | "sku" | "brand" | "departmentId" | "category" | "price" | "rrp" | "stock" | "image" | "fits" | "dealPrice" | "description" | "features" | "specs" | "addOns", string>>;

const LIST = "/admin/products";

/** A specification row being edited; `key` keeps inputs stable while rows are added and removed. */
type SpecRow = { key: number; label: string; value: string };
let specKey = 0;
const specRow = (label = "", value = ""): SpecRow => ({ key: specKey++, label, value });

/**
 * Full-page product editor. `product` is null when creating. When `onAddAnother` is given,
 * a "Save & add another" button calls it after saving instead of returning to the list.
 */
export function ProductForm({ product, onAddAnother }: { product: AdminProduct | null; onAddAnother?: () => void }) {
  const { departments, makes, products, saveProduct } = useAdminStore();
  const router = useRouter();
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
    badge: product?.badge ?? "",
    dealPrice: product?.dealPrice ? String(product.dealPrice) : "",
    features: product?.features.join("\n") ?? "",
  });
  const [trending, setTrending] = useState(product?.trending ?? false);
  const [images, setImages] = useState<string[]>(() => (product?.images ?? []).filter((image) => image !== (product?.image ?? "")));
  const [universal, setUniversal] = useState(product?.fits === "universal");
  const [models, setModels] = useState<Set<string>>(new Set(product && product.fits !== "universal" ? product.fits : []));
  const [specs, setSpecs] = useState<SpecRow[]>(() => product?.specs.map(([label, value]) => specRow(label, value)) ?? []);
  const [addOns, setAddOns] = useState<Set<string>>(new Set(product?.addOnIds ?? []));
  const [errors, setErrors] = useState<Errors>({});
  // Which submit button was pressed.
  const addAnother = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    const rrp = Number(form.rrp || form.price);
    const stock = Number(form.stock);
    const dealPrice = form.dealPrice.trim() ? Number(form.dealPrice) : null;
    const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    // Fully blank rows are dropped; half-filled ones are an error.
    const specRows = specs.map((r) => ({ label: r.label.trim(), value: r.value.trim() })).filter((r) => r.label || r.value);
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Enter a product name.";
    if (!form.sku.trim()) next.sku = "Enter a SKU.";
    if (!form.brand.trim()) next.brand = "Enter a brand.";
    if (!form.departmentId) next.departmentId = "Choose a department.";
    if (!form.category) next.category = "Choose a store category.";
    if (!Number.isInteger(price) || price <= 0) next.price = "Whole dollars, above 0.";
    if (!Number.isInteger(rrp) || rrp < price) next.rrp = "RRP can't be below the price.";
    if (!Number.isInteger(stock) || stock < 0) next.stock = "0 or more.";
    if (dealPrice !== null && (!Number.isInteger(dealPrice) || dealPrice <= 0 || dealPrice >= price)) next.dealPrice = "Whole dollars, below the price.";
    if (form.description.length > 12000) next.description = "Keep the description under 12,000 characters.";
    if (features.length > 12 || features.some((f) => f.length > 200)) next.features = "Up to 12 lines of 200 characters.";
    if (specRows.some((r) => !r.label || !r.value)) next.specs = "Give every row both a name and a value.";
    else if (specRows.length > 30 || specRows.some((r) => r.label.length > 60 || r.value.length > 200)) next.specs = "Up to 30 rows; names up to 60 characters, values up to 200.";
    if (addOns.size > 12) next.addOns = "Pick at most 12 add-ons.";
    if (!form.image.trim()) next.image = "Upload an image or add its path or URL.";
    if (!universal && models.size === 0) next.fits = "Pick at least one model, or mark it universal.";
    setErrors(next);
    if (Object.keys(next).length) {
      // The form is long, so bring the first problem into view.
      requestAnimationFrame(() => formRef.current?.querySelector("[aria-invalid=true], [data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }

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
      images: [form.image.trim(), ...images.filter((image) => image.trim())],
      description: form.description.trim(),
      fits: universal ? "universal" : [...models],
      badge: form.badge.trim(),
      features,
      specs: specRows.map((r): [string, string] => [r.label, r.value]),
      addOnIds: [...addOns],
      dealPrice,
      trending,
      // Ratings come from customer reviews; the server ignores these.
      rating: product?.rating ?? 0,
      reviews: product?.reviews ?? 0,
    });

    if (addAnother.current && onAddAnother) {
      onAddAnother();
      window.scrollTo({ top: 0 });
    } else {
      router.push(LIST);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
        <Link href={LIST}>
          <ArrowLeft /> Products
        </Link>
      </Button>
      <PageHeader title={product ? `Edit ${product.name}` : "Add product"} description="Prices are whole AUD, GST inclusive." />

      <form ref={formRef} onSubmit={submit} noValidate className="grid gap-6 pb-24 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field id="pf-name" label="Name" error={errors.name} className="sm:col-span-2">
                <Input id="pf-name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} autoFocus={!product} />
              </Field>
              <Field id="pf-sku" label="SKU" error={errors.sku}>
                <Input id="pf-sku" value={form.sku} onChange={set("sku")} className="font-mono uppercase" aria-invalid={!!errors.sku} />
              </Field>
              <Field id="pf-brand" label="Brand" error={errors.brand}>
                <Input id="pf-brand" value={form.brand} onChange={set("brand")} aria-invalid={!!errors.brand} />
              </Field>
              <Field id="pf-description" label="Description" className="sm:col-span-2">
                <RichDescriptionEditor id="pf-description" value={form.description} onChange={(description) => setForm((f) => ({ ...f, description }))} />
                <p className="mt-1 text-xs text-muted-foreground">Format the text, add links, and upload images. {productDescriptionText(form.description).length.toLocaleString()} characters.</p>
                {errors.description && <p data-error className="mt-1 text-xs text-destructive">{errors.description}</p>}
              </Field>
              <Field id="pf-features" label="Features (one per line)" error={errors.features} className="sm:col-span-2">
                <Textarea id="pf-features" value={form.features} onChange={set("features")} rows={5} aria-invalid={!!errors.features} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Shown in the Specifications tab, after brand and category. The first four also feature on the homepage spotlight.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {specs.length > 0 && (
                <div className="hidden grid-cols-[2fr_3fr_2.25rem] gap-2 text-xs font-medium text-muted-foreground sm:grid">
                  <span>Name</span>
                  <span>Value</span>
                </div>
              )}
              {specs.map((row, i) => (
                <div key={row.key} className="grid grid-cols-[1fr_2.25rem] gap-2 sm:grid-cols-[2fr_3fr_2.25rem]">
                  <Input
                    value={row.label}
                    onChange={(e) => setSpecs((rows) => rows.map((r) => (r.key === row.key ? { ...r, label: e.target.value } : r)))}
                    placeholder="e.g. Screen"
                    maxLength={60}
                    aria-label={`Specification ${i + 1} name`}
                    aria-invalid={!!errors.specs && !row.label.trim() && !!row.value.trim()}
                  />
                  <Input
                    value={row.value}
                    onChange={(e) => setSpecs((rows) => rows.map((r) => (r.key === row.key ? { ...r, value: e.target.value } : r)))}
                    placeholder='e.g. 9" HD touchscreen'
                    maxLength={200}
                    aria-label={`Specification ${i + 1} value`}
                    aria-invalid={!!errors.specs && !row.value.trim() && !!row.label.trim()}
                    className="col-start-1 sm:col-start-auto"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto"
                    aria-label={`Remove specification ${i + 1}`}
                    onClick={() => setSpecs((rows) => rows.filter((r) => r.key !== row.key))}
                  >
                    <X />
                  </Button>
                </div>
              ))}
              {errors.specs && (
                <p data-error className="text-xs text-destructive">
                  {errors.specs}
                </p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setSpecs((rows) => [...rows, specRow()])} disabled={specs.length >= 30}>
                <Plus /> Add specification
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product images</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Add up to 25 photos. The first photo is used on product cards.</p>
              <div className="space-y-3">
                <Field id="pf-image" label="Main product image" error={errors.image}>
                  <ImageUpload id="pf-image" folder="products" value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} invalid={!!errors.image} />
                </Field>
                {images.map((image, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <Field id={`pf-image-${index}`} label={`Additional image ${index + 1}`}>
                        <ImageUpload id={`pf-image-${index}`} folder="products" value={image} onChange={(url) => setImages((rows) => rows.map((row, i) => i === index ? url : row))} />
                      </Field>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="mt-6" aria-label={`Remove image ${index + 1}`} onClick={() => setImages((rows) => rows.filter((_, i) => i !== index))}><X /></Button>
                  </div>
                ))}
                {images.length < 24 && <Button type="button" variant="outline" size="sm" onClick={() => setImages((rows) => [...rows, ""])}><Plus /> Add image</Button>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing &amp; stock</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field id="pf-price" label="Price ($)" error={errors.price}>
                <Input id="pf-price" inputMode="numeric" value={form.price} onChange={set("price")} aria-invalid={!!errors.price} />
              </Field>
              <Field id="pf-rrp" label="RRP ($)" error={errors.rrp}>
                <Input id="pf-rrp" inputMode="numeric" value={form.rrp} onChange={set("rrp")} placeholder="Same as price" aria-invalid={!!errors.rrp} />
              </Field>
              <Field id="pf-stock" label="Stock" error={errors.stock}>
                <Input id="pf-stock" inputMode="numeric" value={form.stock} onChange={set("stock")} aria-invalid={!!errors.stock} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle fitment</CardTitle>
              <CardDescription>Which vehicles this product fits.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="mb-3 flex items-center gap-2 text-sm">
                <Checkbox checked={universal} onCheckedChange={(v) => setUniversal(v === true)} />
                Universal: fits every vehicle
              </label>
              {!universal && <ModelPicker makes={makes} value={models} onChange={setModels} />}
              {errors.fits && (
                <p data-error className="mt-2 text-xs text-destructive">
                  {errors.fits}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add-ons</CardTitle>
              <CardDescription>
                Optional extras shoppers can tick to add with this product, like a wiring harness or reversing camera. Drafts and sold-out products are hidden in the store.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductPicker products={products.filter((p) => p.id !== product?.id)} value={addOns} onChange={setAddOns} />
              {errors.addOns && (
                <p data-error className="mt-2 text-xs text-destructive">
                  {errors.addOns}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as AdminProduct["status"] }))}>
                <SelectTrigger id="pf-status" className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (visible in store)</SelectItem>
                  <SelectItem value="draft">Draft (hidden)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merchandising</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="pf-deal" label="Today's deal price ($)" error={errors.dealPrice}>
                <Input id="pf-deal" inputMode="numeric" value={form.dealPrice} onChange={set("dealPrice")} placeholder="Not on deal" aria-invalid={!!errors.dealPrice} />
              </Field>
              <Field id="pf-badge" label="Badge">
                <Input id="pf-badge" value={form.badge} onChange={set("badge")} maxLength={30} placeholder="e.g. Best seller" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={trending} onCheckedChange={(v) => setTrending(v === true)} />
                Trending: feature on the homepage
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Kept in view so the form can be saved from anywhere on the page. */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur lg:left-60">
          <div className="flex justify-end gap-2 px-4 py-3 sm:px-6 lg:px-10">
            <Button variant="outline" asChild>
              <Link href={LIST}>Cancel</Link>
            </Button>
            {onAddAnother && (
              <Button type="submit" variant="secondary" onClick={() => (addAnother.current = true)}>
                Save &amp; add another
              </Button>
            )}
            <Button type="submit" onClick={() => (addAnother.current = false)}>
              {product ? "Save changes" : "Add product"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
