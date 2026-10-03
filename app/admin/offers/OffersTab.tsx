"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { newId, useAdminStore } from "@/components/admin/AdminStore";
import { RowActions } from "@/components/admin/RowActions";
import { SortableTable } from "@/components/admin/SortableTable";
import { Empty, Field, PromoStatusBadge, fmtSchedule } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { promoStatus, type Offer } from "@/lib/admin/mock-data";

const NO_COUPON = "none";

export function OffersTab() {
  const { offers, coupons, setOffers, deleteOffer } = useAdminStore();
  const [editing, setEditing] = useState<Offer | "new" | null>(null);
  const [deleting, setDeleting] = useState<Offer | null>(null);

  const codeOf = (id: string | null) => coupons.find((c) => c.id === id)?.code;

  return (
    <>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Drag rows to set the order banners appear on the home page.</p>
            <Button onClick={() => setEditing("new")}>
              <Plus /> Create offer
            </Button>
          </div>
          {offers.length === 0 ? (
            <Empty>No offers yet.</Empty>
          ) : (
            <SortableTable
              rows={offers}
              onReorder={setOffers}
              rowLabel={(o) => o.title}
              columns={[
                {
                  header: "Offer",
                  cell: (o) => (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.image} alt="" className="h-10 w-16 shrink-0 rounded-md object-cover" />
                      <div className="min-w-0">
                        <button type="button" onClick={() => setEditing(o)} className="block max-w-64 truncate text-left font-medium hover:underline">
                          {o.title}
                        </button>
                        <div className="max-w-64 truncate text-xs text-muted-foreground">{o.subtitle}</div>
                      </div>
                    </div>
                  ),
                },
                { header: "Highlight", className: "hidden font-semibold md:table-cell", cell: (o) => o.highlight },
                {
                  header: "Coupon",
                  className: "hidden sm:table-cell",
                  cell: (o) => {
                    const code = codeOf(o.couponId);
                    return code ? <span className="rounded border border-dashed px-1.5 py-0.5 font-mono text-xs">{code}</span> : <span className="text-muted-foreground">—</span>;
                  },
                },
                { header: "Runs", className: "hidden whitespace-nowrap text-muted-foreground lg:table-cell", cell: (o) => fmtSchedule(o.startsAt, o.endsAt) },
                { header: "Status", cell: (o) => <PromoStatusBadge status={promoStatus(o)} /> },
                {
                  header: <span className="sr-only">Actions</span>,
                  className: "w-20",
                  cell: (o) => <RowActions label={o.title} onEdit={() => setEditing(o)} onDelete={() => setDeleting(o)} />,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {editing && <OfferDialog key={editing === "new" ? "new" : editing.id} offer={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete offer?"
        description={`"${deleting?.title}" will be removed from the store. Its coupon code (if any) keeps working.`}
        onConfirm={() => deleting && deleteOffer(deleting.id)}
      />
    </>
  );
}

function OfferDialog({ offer, onClose }: { offer: Offer | null; onClose: () => void }) {
  const { coupons, saveOffer } = useAdminStore();
  const [form, setForm] = useState({
    title: offer?.title ?? "",
    subtitle: offer?.subtitle ?? "",
    highlight: offer?.highlight ?? "",
    image: offer?.image ?? "/images/hero-interior.jpg",
    href: offer?.href ?? "/shop",
    couponId: offer?.couponId ?? NO_COUPON,
    startsAt: offer?.startsAt ?? "",
    endsAt: offer?.endsAt ?? "",
    active: offer?.active ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<"title" | "highlight" | "image" | "href" | "endsAt", string>>>({});
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const coupon = coupons.find((c) => c.id === form.couponId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.title.trim().length < 3) next.title = "Give the offer a title.";
    if (!form.highlight.trim()) next.highlight = "e.g. 30% OFF";
    if (!form.image.trim()) next.image = "Add a banner image.";
    if (!form.href.startsWith("/")) next.href = "A store path starting with /, e.g. /shop?category=lighting";
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) next.endsAt = "Ends before it starts.";
    setErrors(next);
    if (Object.keys(next).length) return;

    saveOffer({
      id: offer?.id ?? newId("o"),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      highlight: form.highlight.trim(),
      image: form.image.trim(),
      href: form.href.trim(),
      couponId: form.couponId === NO_COUPON ? null : form.couponId,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      active: form.active,
      createdAt: offer?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{offer ? "Edit offer" : "Create offer"}</DialogTitle>
          <DialogDescription>A promo banner on the store, optionally showing a coupon code.</DialogDescription>
        </DialogHeader>

        {/* Live preview of the banner. */}
        <div className="relative overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.image} alt="" className="aspect-[16/6] w-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 to-black/10 p-4 text-white">
            <span className="text-2xl font-black">{form.highlight || "HIGHLIGHT"}</span>
            <span className="font-semibold">{form.title || "Offer title"}</span>
            {form.subtitle && <span className="text-sm text-white/80">{form.subtitle}</span>}
            {coupon && <span className="mt-1 w-fit rounded border border-dashed border-white/70 px-1.5 font-mono text-xs">Use code {coupon.code}</span>}
          </div>
        </div>

        <form id="offer-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field id="of-title" label="Title" error={errors.title} className="sm:col-span-2">
            <Input id="of-title" value={form.title} onChange={set("title")} aria-invalid={!!errors.title} />
          </Field>
          <Field id="of-subtitle" label="Subtitle" className="sm:col-span-2">
            <Textarea id="of-subtitle" value={form.subtitle} onChange={set("subtitle")} rows={2} />
          </Field>
          <Field id="of-highlight" label="Highlight" error={errors.highlight}>
            <Input id="of-highlight" value={form.highlight} onChange={set("highlight")} placeholder="30% OFF" aria-invalid={!!errors.highlight} />
          </Field>
          <Field id="of-coupon" label="Coupon code">
            <Select value={form.couponId} onValueChange={(v) => setForm((f) => ({ ...f, couponId: v }))}>
              <SelectTrigger id="of-coupon" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_COUPON}>No code</SelectItem>
                {coupons.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-mono">{c.code}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="of-image" label="Banner image path or URL" error={errors.image}>
            <Input id="of-image" value={form.image} onChange={set("image")} aria-invalid={!!errors.image} />
          </Field>
          <Field id="of-href" label="Links to" error={errors.href}>
            <Input id="of-href" value={form.href} onChange={set("href")} className="font-mono" aria-invalid={!!errors.href} />
          </Field>
          <Field id="of-start" label="Starts (optional)">
            <Input id="of-start" type="date" value={form.startsAt} onChange={set("startsAt")} />
          </Field>
          <Field id="of-end" label="Ends (optional)" error={errors.endsAt}>
            <Input id="of-end" type="date" value={form.endsAt} onChange={set("endsAt")} aria-invalid={!!errors.endsAt} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v === true }))} />
            Turned on (shows on the store while within its dates)
          </label>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="offer-form">
            {offer ? "Save changes" : "Create offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
