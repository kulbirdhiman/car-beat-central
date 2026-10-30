"use client";

import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { newId, useAdminStore } from "@/components/admin/AdminStore";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { MultiImageUpload } from "@/components/admin/MultiImageUpload";
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

type Errors = Partial<Record<"name" | "sku" | "brand" | "departmentId" | "category" | "price" | "rrp" | "stock" | "image" | "fits" | "dealPrice" | "description" | "features" | "keywords" | "options" | "specs" | "addOns", string>>;

const LIST = "/admin/products";

/** A specification row being edited; `key` keeps inputs stable while rows are added and removed. */
type SpecRow = { key: number; label: string; value: string };
let specKey = 0;
const specRow = (label = "", value = ""): SpecRow => ({ key: specKey++, label, value });
type OptionDraft = { name: string; required: boolean; values: { name: string; price: string }[] };

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
    keywords: product?.keywords.join(", ") ?? "",
  });
  const [trending, setTrending] = useState(product?.trending ?? false);
  const [images, setImages] = useState<string[]>(() => (product?.images ?? []).filter((image) => image !== (product?.image ?? "")));
  const [universal, setUniversal] = useState(product?.fits === "universal");
  const [models, setModels] = useState<Set<string>>(new Set(product && product.fits !== "universal" ? product.fits : []));
  const [specs, setSpecs] = useState<SpecRow[]>(() => product?.specs.map(([label, value]) => specRow(label, value)) ?? []);
  const [addOns, setAddOns] = useState<Set<string>>(new Set(product?.addOnIds ?? []));
  const [optionGroups, setOptionGroups] = useState<OptionDraft[]>(() => product?.optionGroups.map((group) => ({ name: group.name, required: group.required, values: group.values.map((choice) => ({ name: choice.name, price: String(choice.price) })) })) ?? []);
  const [fitmentYears, setFitmentYears] = useState<Record<string, { from: string; to: string }>>(() => Object.fromEntries(Object.entries(product?.fitmentYears ?? {}).map(([id, range]) => [id, { from: range.from == null ? "" : String(range.from), to: range.to == null ? "" : String(range.to) }])));
  const [draftYears, setDraftYears] = useState({ from: "", to: "" });
  const selectedVehicles = makes.flatMap((make) => make.models.flatMap((model) => [{ id: model.id, name: `${make.name} ${model.name}` }, ...model.subModels.map((sub) => ({ id: sub.id, name: `${make.name} ${model.name} · ${sub.name}` }))])).filter((vehicle) => models.has(vehicle.id));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  // Which submit button was pressed.
  const addAnother = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function selectModels(next: Set<string>) {
    setFitmentYears((current) => {
      const updated = { ...current };
      for (const id of next) {
        if (!models.has(id) && !updated[id]) updated[id] = { ...draftYears };
      }
      return updated;
    });
    setModels(next);
    if (next.size) setUniversal(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaveError(null);
    const price = Number(form.price);
    const rrp = Number(form.rrp || form.price);
    const stock = Number(form.stock);
    const dealPrice = form.dealPrice.trim() ? Number(form.dealPrice) : null;
    const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    const keywords = [...new Set(form.keywords.split(/[\n,]/).map((keyword) => keyword.trim()).filter(Boolean))];
    const cleanOptionGroups = optionGroups.map((group) => ({
      name: group.name.trim(),
      required: group.required,
      values: group.values.filter((choice) => choice.name.trim()).map((choice) => ({ name: choice.name.trim(), price: Number(choice.price) })),
    }));
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
    if (keywords.length > 30 || keywords.some((keyword) => keyword.length > 60)) next.keywords = "Up to 30 keywords, each no longer than 60 characters.";
    if (
      optionGroups.length > 3 ||
      cleanOptionGroups.some((group) => !group.name || group.name.length > 40 || group.values.length === 0 || group.values.length > 20 || group.values.some((choice) => !choice.name || choice.name.length > 60 || !Number.isInteger(choice.price) || choice.price < 0 || choice.price > 1_000_000) || new Set(group.values.map((choice) => choice.name.toLowerCase())).size !== group.values.length) ||
      new Set(cleanOptionGroups.map((group) => group.name.toLowerCase())).size !== cleanOptionGroups.length
    ) next.options = "Add up to 3 uniquely named option groups. Each group needs choices with a whole-dollar price add-on of $0 or more.";
    if (specRows.some((r) => !r.label || !r.value)) next.specs = "Give every row both a name and a value.";
    else if (specRows.length > 30 || specRows.some((r) => r.label.length > 60 || r.value.length > 200)) next.specs = "Up to 30 rows; names up to 60 characters, values up to 200.";
    if (addOns.size > 12) next.addOns = "Pick at most 12 add-ons.";
    if (!form.image.trim()) next.image = "Upload an image or add its path or URL.";
    if (!universal && models.size === 0) next.fits = "Pick at least one model, or mark it universal.";
    const cleanFitmentYears: NonNullable<AdminProduct["fitmentYears"]> = {};
    if (!universal) for (const id of models) {
      const range = fitmentYears[id];
      if (!range || (!range.from && !range.to)) continue;
      const from = range.from ? Number(range.from) : null;
      const to = range.to ? Number(range.to) : null;
      cleanFitmentYears[id] = from !== null && to !== null && from > to ? { from: to, to: from } : { from, to };
    }
    setErrors(next);
    if (Object.keys(next).length) {
      // The form is long, so bring the first problem into view.
      requestAnimationFrame(() => formRef.current?.querySelector("[aria-invalid=true], [data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }

    setSaving(true);
    try {
      await saveProduct({
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
        fitmentYears: cleanFitmentYears,
        badge: form.badge.trim(),
        features,
        keywords,
        optionGroups: cleanOptionGroups,
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
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Couldn't save the product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
        <Link href={LIST}>
          <ArrowLeft /> Products
        </Link>
      </Button>
      <PageHeader title={product ? `Edit ${product.name}` : "Add product"} description="Start with the required details, then add the extra product information. Prices are whole AUD, GST inclusive." />

      <form ref={formRef} onSubmit={submit} noValidate className="mx-auto max-w-6xl space-y-6 pb-24">
        <nav aria-label="Product form sections" className="no-scrollbar sticky top-16 z-10 -mx-2 flex gap-2 overflow-x-auto rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur sm:mx-0 sm:flex-wrap">
          {[
            ["Basics", "#pf-basics"],
            ["Photos", "#pf-images"],
            ["Price & stock", "#pf-pricing"],
            ["Vehicle fitment", "#pf-fitment"],
            ["Options", "#pf-options"],
            ["Specifications", "#pf-specs"],
            ["Add-ons", "#pf-addons"],
            ["Publish", "#pf-publish"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="shrink-0 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary">
              {label}
            </a>
          ))}
        </nav>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <Card id="pf-basics" className="scroll-mt-36">
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
              <Field id="pf-keywords" label="Keywords (comma or line separated)" error={errors.keywords} className="sm:col-span-2">
                <Textarea id="pf-keywords" value={form.keywords} onChange={set("keywords")} rows={3} placeholder="e.g. carplay stereo, wireless head unit" aria-invalid={!!errors.keywords} />
              </Field>
              <div id="pf-options" className="scroll-mt-36 space-y-3 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium">Options and prices</h3>
                    <p className="text-xs text-muted-foreground">Groups are independent. Add each choice&apos;s extra price, such as 10 for +$10.</p>
                  </div>
                  {optionGroups.length < 3 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setOptionGroups((groups) => [...groups, { name: "", required: true, values: [{ name: "", price: "0" }] }])}>
                      <Plus /> Add option
                    </Button>
                  )}
                </div>
                {optionGroups.map((group, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-start">
                    <div className="grid gap-3">
                      <Field id={`pf-option-name-${index}`} label="Option name">
                        <Input id={`pf-option-name-${index}`} value={group.name} onChange={(event) => setOptionGroups((groups) => groups.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} placeholder="Color" />
                      </Field>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={group.required} onCheckedChange={(checked) => setOptionGroups((groups) => groups.map((item, i) => i === index ? { ...item, required: checked === true } : item))} />
                        Required
                      </label>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-[1fr_9rem_2.5rem] gap-2 text-xs font-medium text-muted-foreground">
                        <span>Choice</span><span>Add to price (AUD)</span><span />
                      </div>
                      {group.values.map((choice, valueIndex) => (
                        <div key={valueIndex} className="grid grid-cols-[1fr_9rem_2.5rem] items-center gap-2">
                          <Input value={choice.name} onChange={(event) => setOptionGroups((groups) => groups.map((item, i) => i === index ? { ...item, values: item.values.map((value, j) => j === valueIndex ? { ...value, name: event.target.value } : value) } : item))} placeholder={valueIndex === 0 ? "Red" : "Black"} aria-label={`${group.name || "Option"} choice ${valueIndex + 1}`} />
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+$</span>
                            <Input type="number" min="0" step="1" className="pl-9" value={choice.price} onChange={(event) => setOptionGroups((groups) => groups.map((item, i) => i === index ? { ...item, values: item.values.map((value, j) => j === valueIndex ? { ...value, price: event.target.value } : value) } : item))} aria-label={`${choice.name || "Choice"} price add-on`} />
                          </div>
                          <Button type="button" variant="ghost" size="icon" aria-label={`Remove choice ${choice.name || valueIndex + 1}`} onClick={() => setOptionGroups((groups) => groups.map((item, i) => i === index ? { ...item, values: item.values.filter((_, j) => j !== valueIndex) } : item))}>
                            <X />
                          </Button>
                        </div>
                      ))}
                      {group.values.length < 20 && (
                        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setOptionGroups((groups) => groups.map((item, i) => i === index ? { ...item, values: [...item.values, { name: "", price: "0" }] } : item))}>
                          <Plus /> Add choice
                        </Button>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="sm:mt-7" aria-label={`Remove option ${group.name || index + 1}`} onClick={() => setOptionGroups((groups) => groups.filter((_, i) => i !== index))}>
                      <X />
                    </Button>
                  </div>
                ))}
                {errors.options && <p className="text-xs text-destructive">{errors.options}</p>}
              </div>
            </CardContent>
          </Card>

          <Card id="pf-specs" className="scroll-mt-36">
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

          <Card id="pf-images" className="scroll-mt-36">
            <CardHeader>
              <CardTitle>Product images</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Add one main photo and up to 24 gallery photos. The main photo is used on product cards.</p>
              <div className="space-y-3">
                <Field id="pf-image" label="Main product image" error={errors.image}>
                  <ImageUpload id="pf-image" folder="products" value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} invalid={!!errors.image} />
                </Field>
                <Field label="Gallery photos">
                  <MultiImageUpload images={images} onChange={setImages} maxImages={24} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card id="pf-pricing" className="scroll-mt-36">
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

          <Card id="pf-fitment" className="scroll-mt-36">
            <CardHeader>
              <CardTitle>Vehicle fitment</CardTitle>
              <CardDescription>Enter or change the year range and select compatible models and submodels.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="mb-3 flex items-center gap-2 text-sm">
                <Checkbox checked={universal} onCheckedChange={(v) => setUniversal(v === true)} />
                Universal: fits every vehicle
              </label>
              <div className="mb-4 space-y-3 rounded-lg bg-muted/30 p-3">
                <h3 className="text-sm font-semibold">From / To year</h3>
                <p className="text-sm text-muted-foreground">Enter a range before selecting vehicles, or apply it to the vehicles already selected. You can also change each vehicle’s years below.</p>
                <YearRangeFields id="pf-default-years" value={draftYears} onChange={setDraftYears} />
                <Button type="button" variant="outline" disabled={universal || !selectedVehicles.length} onClick={() => setFitmentYears((current) => ({ ...current, ...Object.fromEntries([...models].map((id) => [id, { ...draftYears }])) }))}>
                  Apply to selected vehicles
                </Button>
                {universal && <p className="text-xs text-muted-foreground">Universal products fit all years. Select a model or submodel below to use a specific range.</p>}
              </div>
              <ModelPicker makes={makes} value={universal ? new Set<string>() : models} onChange={selectModels} includeSubModels />
              {!universal && selectedVehicles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Years for each selected vehicle. Either year is optional. Leave both blank for all years.</p>
                  {selectedVehicles.map((vehicle) => (
                    <fieldset key={vehicle.id} className="rounded-lg border p-3">
                      <legend className="px-1 text-sm font-medium">{vehicle.name}</legend>
                      <YearRangeFields id={`pf-year-${vehicle.id}`} value={fitmentYears[vehicle.id] ?? { from: "", to: "" }} onChange={(range) => setFitmentYears((current) => ({ ...current, [vehicle.id]: range }))} />
                    </fieldset>
                  ))}
                </div>
              )}
              {errors.fits && (
                <p data-error className="mt-2 text-xs text-destructive">
                  {errors.fits}
                </p>
              )}
            </CardContent>
          </Card>

          <Card id="pf-addons" className="scroll-mt-36">
            <CardHeader>
              <CardTitle>Add-ons</CardTitle>
              <CardDescription>
                Optional extras shoppers can tick to add with this product, like a wiring harness or reversing camera. Drafts and sold-out products are hidden in the store.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductPicker products={products.filter((p) => p.id !== product?.id)} departments={departments} value={addOns} onChange={setAddOns} />
              {errors.addOns && (
                <p data-error className="mt-2 text-xs text-destructive">
                  {errors.addOns}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card id="pf-publish" className="scroll-mt-36">
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
        </div>

        {/* Kept in view so the form can be saved from anywhere on the page. */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur lg:left-60">
          {saveError && <p role="alert" className="px-4 pt-3 text-sm text-destructive sm:px-6 lg:px-10">{saveError}</p>}
          <div className="flex justify-end gap-2 px-4 py-3 sm:px-6 lg:px-10">
            <Button variant="outline" asChild>
              <Link href={LIST}>Cancel</Link>
            </Button>
            {onAddAnother && (
              <Button type="submit" disabled={saving} variant="secondary" onClick={() => (addAnother.current = true)}>
                Save &amp; add another
              </Button>
            )}
            <Button type="submit" disabled={saving} onClick={() => (addAnother.current = false)}>
              {saving ? "Saving…" : product ? "Save changes" : "Add product"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

function YearRangeFields({ id, value, onChange }: { id: string; value: { from: string; to: string }; onChange: (range: { from: string; to: string }) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["from", "to"] as const).map((bound) => (
        <Field key={bound} id={`${id}-${bound}`} label={bound === "from" ? "From year" : "To year"}>
          <Input id={`${id}-${bound}`} type="text" inputMode="numeric" maxLength={4} placeholder={bound === "from" ? "2004" : "2009"} value={value[bound]} onChange={(event) => {
            const next = event.target.value;
            if (/^\d{0,4}$/.test(next)) onChange({ ...value, [bound]: next });
          }} />
        </Field>
      ))}
    </div>
  );
}
