"use client";

import { Copy, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { newId, useAdminStore } from "@/components/admin/AdminStore";
import { RowActions } from "@/components/admin/RowActions";
import { DepartmentPicker, ModelPicker, ProductPicker } from "@/components/admin/Pickers";
import { Empty, Field, PromoStatusBadge, fmtSchedule } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { couponConditions, couponScopeSummary } from "@/lib/admin/coupons";
import {
  COUPON_SCOPE_LABEL,
  COUPON_TYPE_LABEL,
  PROMO_STATUS_LABEL,
  couponValueLabel,
  promoStatus,
  type Coupon,
  type CouponScope,
  type CouponType,
  type PromoStatus,
} from "@/lib/admin/mock-data";
import { CouponTester } from "./CouponTester";

const ALL = "all";

export function CouponsTab() {
  const { coupons, departments, offers, products, makes, deleteCoupon } = useAdminStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PromoStatus | typeof ALL>(ALL);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const q = query.trim().toLowerCase();
  const rows = coupons
    .filter((c) => (!q || c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) && (status === ALL || promoStatus(c) === status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const usedBy = deleting ? offers.filter((o) => o.couponId === deleting.id) : [];

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Couldn't copy to the clipboard.");
    }
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search code or description" className="pl-8" aria-label="Search coupons" />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as PromoStatus | typeof ALL)}>
              <SelectTrigger className="w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any status</SelectItem>
                {(Object.keys(PROMO_STATUS_LABEL) as PromoStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROMO_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setEditing("new")}>
              <Plus /> Create coupon
            </Button>
          </div>

          {rows.length === 0 ? (
            <Empty>No coupon codes match.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="hidden lg:table-cell">Applies to & conditions</TableHead>
                  <TableHead className="hidden md:table-cell">Used</TableHead>
                  <TableHead className="hidden xl:table-cell">Runs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setEditing(c)} className="font-mono font-medium hover:underline">
                          {c.code}
                        </button>
                        <Button variant="ghost" size="icon-xs" onClick={() => copy(c.code)} aria-label={`Copy ${c.code}`}>
                          <Copy />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-72 whitespace-normal">
                      <div className="font-medium">{couponValueLabel(c)}</div>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    </TableCell>
                    <TableCell className="hidden max-w-56 whitespace-normal lg:table-cell">
                      {c.scope !== "all" && <div className="text-xs font-medium text-muted-foreground">{COUPON_SCOPE_LABEL[c.scope]}</div>}
                      <div className="line-clamp-2">{couponScopeSummary(c, { products, departments, makes })}</div>
                      <div className="text-xs text-muted-foreground">{couponConditions(c)}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="tabular-nums">
                        {c.used.toLocaleString("en-AU")}
                        <span className="text-muted-foreground"> / {c.usageLimit === null ? "∞" : c.usageLimit.toLocaleString("en-AU")}</span>
                      </div>
                      {c.usageLimit !== null && (
                        <div className="mt-1 h-1.5 w-24 rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (c.used / c.usageLimit) * 100)}%` }} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">{fmtSchedule(c.startsAt, c.endsAt)}</TableCell>
                    <TableCell>
                      <PromoStatusBadge status={promoStatus(c)} />
                    </TableCell>
                    <TableCell>
                      <RowActions label={c.code} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing && <CouponDialog key={editing === "new" ? "new" : editing.id} coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.code}?`}
        description={
          usedBy.length
            ? `Shoppers won't be able to use it any more. ${usedBy.length === 1 ? "The offer" : `${usedBy.length} offers`} showing it (${usedBy.map((o) => o.title).join(", ")}) will keep running without a code.`
            : "Shoppers won't be able to use it any more."
        }
        onConfirm={() => deleting && deleteCoupon(deleting.id)}
      />
    </>
  );
}

/** e.g. "CB-K7Q2XM" without ambiguous characters (0/O, 1/I). */
function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "CB" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

type FormErrors = Partial<Record<"code" | "value" | "buyQty" | "getQty" | "minOrder" | "maxDiscount" | "usageLimit" | "endsAt" | "scope", string>>;

/** A cap only makes sense where the discount can grow with the cart. */
const CAPPABLE: CouponType[] = ["percent", "buy_x_get_y"];

function CouponDialog({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
  const { coupons, departments, products, makes, saveCoupon } = useAdminStore();
  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    type: coupon?.type ?? ("percent" as CouponType),
    value: coupon ? String(coupon.value) : "10",
    buyQty: coupon ? String(coupon.buyQty || 2) : "2",
    getQty: coupon ? String(coupon.getQty || 1) : "1",
    minOrder: coupon ? String(coupon.minOrder) : "0",
    maxDiscount: coupon?.maxDiscount != null ? String(coupon.maxDiscount) : "",
    scope: coupon?.scope ?? ("all" as CouponScope),
    usageLimit: coupon?.usageLimit != null ? String(coupon.usageLimit) : "",
    startsAt: coupon?.startsAt ?? "",
    endsAt: coupon?.endsAt ?? "",
    firstOrderOnly: coupon?.firstOrderOnly ?? false,
    active: coupon?.active ?? true,
  });
  const [productIds, setProductIds] = useState<Set<string>>(new Set(coupon?.productIds ?? []));
  const [departmentIds, setDepartmentIds] = useState<Set<string>>(new Set(coupon?.departmentIds ?? []));
  const [modelIds, setModelIds] = useState<Set<string>>(new Set(coupon?.modelIds ?? []));
  const [errors, setErrors] = useState<FormErrors>({});
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const int = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s) : NaN);

  const code = form.code.trim().toUpperCase();
  const value = int(form.value);
  const buyQty = int(form.buyQty);
  const getQty = int(form.getQty);
  const minOrder = int(form.minOrder || "0");
  const maxDiscount = CAPPABLE.includes(form.type) && form.maxDiscount.trim() ? int(form.maxDiscount) : null;
  const usageLimit = form.usageLimit.trim() ? int(form.usageLimit) : null;

  // The coupon as currently filled in; the tester runs against this before it's saved.
  const draft: Coupon = {
    id: coupon?.id ?? "draft",
    code,
    description: form.description.trim(),
    type: form.type,
    value: form.type === "percent" || form.type === "fixed" ? value : 0,
    buyQty: form.type === "buy_x_get_y" ? buyQty : 0,
    getQty: form.type === "buy_x_get_y" ? getQty : 0,
    minOrder: Number.isNaN(minOrder) ? 0 : minOrder,
    maxDiscount: maxDiscount !== null && Number.isNaN(maxDiscount) ? null : maxDiscount,
    scope: form.scope,
    productIds: form.scope === "products" ? [...productIds] : [],
    departmentIds: form.scope === "departments" ? [...departmentIds] : [],
    modelIds: form.scope === "models" ? [...modelIds] : [],
    firstOrderOnly: form.firstOrderOnly,
    usageLimit,
    used: coupon?.used ?? 0,
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    active: form.active,
    createdAt: coupon?.createdAt ?? new Date().toISOString(),
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const next: FormErrors = {};
    if (!/^[A-Z0-9]{3,20}$/.test(code)) next.code = "3–20 letters and numbers, no spaces.";
    else if (coupons.some((c) => c.code === code && c.id !== coupon?.id)) next.code = "Another coupon already uses this code.";
    if (form.type === "percent" && !(value >= 1 && value <= 100)) next.value = "Between 1 and 100.";
    if (form.type === "fixed" && !(value >= 1)) next.value = "Whole dollars, at least 1.";
    if (form.type === "buy_x_get_y") {
      if (!(buyQty >= 1)) next.buyQty = "At least 1.";
      if (!(getQty >= 1)) next.getQty = "At least 1.";
    }
    if (Number.isNaN(minOrder)) next.minOrder = "Whole dollars, or 0 for none.";
    if (maxDiscount !== null && !(maxDiscount >= 1)) next.maxDiscount = "Whole dollars, or leave blank for no cap.";
    const picked = { all: 1, products: productIds.size, departments: departmentIds.size, models: modelIds.size }[form.scope];
    if (picked === 0) next.scope = `Pick at least one ${{ products: "product", departments: "department", models: "vehicle model" }[form.scope as Exclude<CouponScope, "all">]}.`;
    if (usageLimit !== null && !(usageLimit >= 1)) next.usageLimit = "At least 1, or leave blank for unlimited.";
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) next.endsAt = "Ends before it starts.";
    setErrors(next);
    if (Object.keys(next).length) return;

    saveCoupon({ ...draft, id: coupon?.id ?? newId("c") });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{coupon ? `Edit ${coupon.code}` : "Create coupon code"}</DialogTitle>
          <DialogDescription>Shoppers enter the code at checkout.</DialogDescription>
        </DialogHeader>

        <form id="coupon-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field id="cf-code" label="Code" error={errors.code} className="sm:col-span-2">
            <div className="flex gap-2">
              <Input
                id="cf-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") }))}
                placeholder="e.g. BASSDROP"
                className="font-mono uppercase"
                aria-invalid={!!errors.code}
              />
              <Button type="button" variant="outline" onClick={() => setForm((f) => ({ ...f, code: randomCode() }))}>
                Generate
              </Button>
            </div>
          </Field>
          <Field id="cf-description" label="Description (shown to shoppers)" className="sm:col-span-2">
            <Input id="cf-description" value={form.description} onChange={set("description")} placeholder="e.g. $50 off your first order over $299" />
          </Field>

          <Field id="cf-type" label="Discount type">
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CouponType }))}>
              <SelectTrigger id="cf-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(COUPON_TYPE_LABEL) as CouponType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {COUPON_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {form.type === "percent" || form.type === "fixed" ? (
            <Field id="cf-value" label={form.type === "percent" ? "Percent off" : "Dollars off"} error={errors.value}>
              <Input id="cf-value" inputMode="numeric" value={form.value} onChange={set("value")} aria-invalid={!!errors.value} />
            </Field>
          ) : form.type === "buy_x_get_y" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field id="cf-buy" label="Buy" error={errors.buyQty}>
                <Input id="cf-buy" inputMode="numeric" value={form.buyQty} onChange={set("buyQty")} aria-invalid={!!errors.buyQty} />
              </Field>
              <Field id="cf-get" label="Get free" error={errors.getQty}>
                <Input id="cf-get" inputMode="numeric" value={form.getQty} onChange={set("getQty")} aria-invalid={!!errors.getQty} />
              </Field>
            </div>
          ) : (
            <p className="self-end pb-2 text-sm text-muted-foreground">Shipping is free on any delivery option.</p>
          )}

          <Field id="cf-min" label="Minimum order ($)" error={errors.minOrder}>
            <Input id="cf-min" inputMode="numeric" value={form.minOrder} onChange={set("minOrder")} aria-invalid={!!errors.minOrder} />
          </Field>
          {CAPPABLE.includes(form.type) ? (
            <Field id="cf-max" label="Maximum discount ($)" error={errors.maxDiscount}>
              <Input id="cf-max" inputMode="numeric" value={form.maxDiscount} onChange={set("maxDiscount")} placeholder="No cap" aria-invalid={!!errors.maxDiscount} />
            </Field>
          ) : (
            <p className="self-end pb-2 text-xs text-muted-foreground">
              {form.type === "fixed" ? "A $ off code is already a fixed amount, so there's no cap." : "No cap needed for free shipping."}
            </p>
          )}
          <Field id="cf-limit" label="Total uses allowed" error={errors.usageLimit}>
            <Input id="cf-limit" inputMode="numeric" value={form.usageLimit} onChange={set("usageLimit")} placeholder="Unlimited" aria-invalid={!!errors.usageLimit} />
          </Field>
          <Field id="cf-start" label="Starts (optional)">
            <Input id="cf-start" type="date" value={form.startsAt} onChange={set("startsAt")} />
          </Field>
          <Field id="cf-end" label="Ends (optional)" error={errors.endsAt}>
            <Input id="cf-end" type="date" value={form.endsAt} onChange={set("endsAt")} aria-invalid={!!errors.endsAt} />
          </Field>

          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">Applies to</legend>
            <RadioGroup value={form.scope} onValueChange={(v) => setForm((f) => ({ ...f, scope: v as CouponScope }))} className="mb-3 grid-cols-2">
              {(Object.keys(COUPON_SCOPE_LABEL) as CouponScope[]).map((scope) => (
                <label key={scope} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5">
                  <RadioGroupItem value={scope} />
                  {COUPON_SCOPE_LABEL[scope]}
                </label>
              ))}
            </RadioGroup>
            {form.scope === "products" && <ProductPicker products={products} value={productIds} onChange={setProductIds} />}
            {form.scope === "departments" && <DepartmentPicker departments={departments} value={departmentIds} onChange={setDepartmentIds} />}
            {form.scope === "models" && (
              <>
                <p className="mb-2 text-xs text-muted-foreground">Applies to products that fit any ticked model, including universal products.</p>
                <ModelPicker makes={makes} value={modelIds} onChange={setModelIds} />
              </>
            )}
            {form.scope === "all" && <p className="text-xs text-muted-foreground">Every product in the cart counts towards the discount.</p>}
            {errors.scope && <p className="mt-2 text-xs text-destructive">{errors.scope}</p>}
          </fieldset>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.firstOrderOnly} onCheckedChange={(v) => setForm((f) => ({ ...f, firstOrderOnly: v === true }))} />
              First order only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v === true }))} />
              Turned on (works at checkout while within its dates)
            </label>
          </div>
        </form>

        <CouponTester coupon={draft} />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="coupon-form">
            {coupon ? "Save changes" : "Create coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
