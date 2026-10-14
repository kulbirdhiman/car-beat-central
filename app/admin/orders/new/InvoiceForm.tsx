"use client";

import { ArrowLeft, ChevronsUpDown, Plus, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "@/components/admin/AdminStore";
import { Field, PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_LABEL, type AdminOrder, type AdminProduct, type InvoiceInput } from "@/lib/admin/model";
import { AU_STATES, formatCents } from "@/lib/data";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/payment";
import { DELIVERY_OPTIONS } from "@/lib/pricing";

const LIST = "/admin/orders";

type Line = { productId: string; qty: string; unitPrice: string };

/** "12.50" -> 1250; anything that isn't a non-negative amount -> NaN. */
const toCents = (dollars: string) => (/^\d+(\.\d{1,2})?$/.test(dollars.trim()) ? Math.round(Number(dollars) * 100) : NaN);
const toDollars = (cents: number) => (cents / 100).toFixed(2);
const catalogueCents = (p: AdminProduct) => (p.dealPrice ?? p.price) * 100;

/** Raises a manual invoice: an order the customer pays from its link, at the prices set here. */
export function InvoiceForm() {
  const { orders, products, createInvoice } = useAdminStore();
  const router = useRouter();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [shipTo, setShipTo] = useState({ address: "", suburb: "", state: "NSW", postcode: "" });
  const [delivery, setDelivery] = useState<AdminOrder["delivery"]>("standard");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState("0.00");
  // Shipping follows the delivery option's usual fee until the admin types their own.
  const [shippingOverride, setShippingOverride] = useState<string | null>(null);
  const [methods, setMethods] = useState<Set<PaymentMethod>>(new Set(["paypal", "bank_transfer"]));
  const [paid, setPaid] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const subtotal = lines.reduce((n, l) => n + (toCents(l.unitPrice) || 0) * (Number(l.qty) || 0), 0);
  const discountCents = toCents(discount) || 0;
  const option = DELIVERY_OPTIONS[delivery];
  const defaultShipping = lines.length === 0 || (option.freeOver !== null && subtotal - discountCents >= option.freeOver) ? 0 : option.fee;
  const shipping = shippingOverride === null ? toDollars(defaultShipping) : shippingOverride;
  const total = subtotal - discountCents + (toCents(shipping) || 0);

  function pickCustomer(o: AdminOrder) {
    setCustomer({ ...o.customer });
    setShipTo({ ...o.shipTo });
  }

  function addProduct(p: AdminProduct) {
    if (lines.some((l) => l.productId === p.id)) return;
    setLines((list) => [...list, { productId: p.id, qty: "1", unitPrice: toDollars(catalogueCents(p)) }]);
  }

  const setLine = (productId: string, patch: Partial<Line>) => setLines((list) => list.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));

  function validate(): string | null {
    if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim()) return "Fill in the customer's name, email and phone.";
    if (!shipTo.address.trim() || !shipTo.suburb.trim() || !/^\d{4}$/.test(shipTo.postcode.trim())) return "Fill in the address, suburb and a 4-digit postcode.";
    if (lines.length === 0) return "Add at least one product.";
    for (const l of lines) {
      const product = products.find((p) => p.id === l.productId);
      const qty = Number(l.qty);
      if (!Number.isInteger(qty) || qty < 1) return `Enter a whole-number quantity for ${product?.name ?? "each product"}.`;
      if (Number.isNaN(toCents(l.unitPrice))) return `Enter a price like 129.00 for ${product?.name ?? "each product"}.`;
      if (product && qty > product.stock) return `Only ${product.stock} of ${product.name} in stock.`;
    }
    if (Number.isNaN(toCents(discount))) return "Enter the discount like 20.00, or 0.";
    if (discountCents > subtotal) return "The discount can't be more than the subtotal.";
    if (Number.isNaN(toCents(shipping))) return "Enter shipping like 9.95, or 0.";
    if (!paid && methods.size === 0) return "Choose at least one way for the customer to pay.";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    const input: InvoiceInput = {
      customer,
      shipTo,
      delivery,
      items: lines.map((l) => ({ productId: l.productId, qty: Number(l.qty), unitPrice: toCents(l.unitPrice) })),
      shipping: toCents(shipping),
      discount: discountCents,
      paymentMethods: [...methods],
      paid,
      note,
    };
    setSaving(true);
    try {
      const order = await createInvoice(input);
      toast.success(`Invoice ${order.number} created.`);
      router.push(`${LIST}?open=${order.id}`);
    } catch (error) {
      toast.error((error as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Link href={LIST} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <PageHeader title="New invoice" description="Bill a customer for products. They get a link to view the invoice and pay." />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Pick someone who has ordered before, or type in a new customer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CustomerPicker orders={orders} onPick={pickCustomer} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="name" label="Name">
                  <Input id="name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} required maxLength={100} />
                </Field>
                <Field id="email" label="Email">
                  <Input id="email" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} required maxLength={200} />
                </Field>
                <Field id="phone" label="Phone">
                  <Input id="phone" type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} required maxLength={20} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-6">
                <Field id="address" label={delivery === "collect" ? "Billing address" : "Delivery address"} className="sm:col-span-6">
                  <Input id="address" value={shipTo.address} onChange={(e) => setShipTo({ ...shipTo, address: e.target.value })} required maxLength={200} />
                </Field>
                <Field id="suburb" label="Suburb" className="sm:col-span-3">
                  <Input id="suburb" value={shipTo.suburb} onChange={(e) => setShipTo({ ...shipTo, suburb: e.target.value })} required maxLength={100} />
                </Field>
                <Field id="state" label="State" className="sm:col-span-1">
                  <Select value={shipTo.state} onValueChange={(state) => setShipTo({ ...shipTo, state })}>
                    <SelectTrigger id="state" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AU_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="postcode" label="Postcode" className="sm:col-span-2">
                  <Input id="postcode" inputMode="numeric" value={shipTo.postcode} onChange={(e) => setShipTo({ ...shipTo, postcode: e.target.value })} required maxLength={4} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Prices start at the catalogue price (or deal price). Change them for a quoted price.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lines.length > 0 && (
                <ul className="divide-y rounded-lg border">
                  {lines.map((l) => {
                    const p = products.find((x) => x.id === l.productId);
                    return (
                      <li key={l.productId} className="flex flex-wrap items-center gap-3 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p && <img src={p.image} alt="" className="size-10 shrink-0 rounded object-cover" />}
                        <div className="min-w-0 flex-1 basis-40">
                          <p className="truncate text-sm font-medium">{p?.name ?? l.productId}</p>
                          <p className="text-xs text-muted-foreground">
                            {p?.sku && `${p.sku} · `}
                            {p ? `${p.stock} in stock` : "No longer in the catalogue"}
                          </p>
                        </div>
                        <Input
                          aria-label="Quantity"
                          inputMode="numeric"
                          className="w-16 text-right tabular-nums"
                          value={l.qty}
                          onChange={(e) => setLine(l.productId, { qty: e.target.value })}
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                          <Input
                            aria-label="Unit price"
                            inputMode="decimal"
                            className="w-28 pl-6 text-right tabular-nums"
                            value={l.unitPrice}
                            onChange={(e) => setLine(l.productId, { unitPrice: e.target.value })}
                          />
                        </div>
                        <span className="w-24 text-right text-sm tabular-nums">{formatCents((toCents(l.unitPrice) || 0) * (Number(l.qty) || 0))}</span>
                        <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => setLines((list) => list.filter((x) => x.productId !== l.productId))}>
                          <Trash2 />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <ProductAdder products={products} taken={new Set(lines.map((l) => l.productId))} onAdd={addProduct} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>The ways to pay shown on the invoice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={methods.has(m)}
                      disabled={paid}
                      onCheckedChange={(v) =>
                        setMethods((set) => {
                          const next = new Set(set);
                          if (v === true) next.add(m);
                          else next.delete(m);
                          return next;
                        })
                      }
                    />
                    {PAYMENT_METHODS[m]}
                  </label>
                ))}
              </div>
              <Separator />
              <label className="flex items-start gap-2 text-sm">
                <Checkbox className="mt-0.5" checked={paid} onCheckedChange={(v) => setPaid(v === true)} />
                <span>
                  Already paid
                  <span className="block text-muted-foreground">E.g. paid in store. The invoice is created as paid and works as a receipt.</span>
                </span>
              </label>
              <Field id="note" label="Note to customer (optional)">
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} placeholder="E.g. Includes fitting on Saturday 10am." />
              </Field>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="delivery" label="Delivery">
              <Select value={delivery} onValueChange={(v) => setDelivery(v as AdminOrder["delivery"])}>
                <SelectTrigger id="delivery" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DELIVERY_LABEL) as AdminOrder["delivery"][]).map((d) => (
                    <SelectItem key={d} value={d}>
                      {DELIVERY_LABEL[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="shipping" label="Shipping ($)">
                <Input id="shipping" inputMode="decimal" className="tabular-nums" value={shipping} onChange={(e) => setShippingOverride(e.target.value)} />
              </Field>
              <Field id="discount" label="Discount ($)">
                <Input id="discount" inputMode="decimal" className="tabular-nums" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
            </div>
            {shippingOverride !== null && (
              <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => setShippingOverride(null)}>
                Use the usual shipping fee
              </button>
            )}
            <dl className="space-y-1 border-t pt-3 text-sm">
              <SummaryLine label="Subtotal" value={formatCents(subtotal)} />
              {discountCents > 0 && <SummaryLine label="Discount" value={`−${formatCents(discountCents)}`} />}
              <SummaryLine label="Shipping" value={(toCents(shipping) || 0) ? formatCents(toCents(shipping)) : "Free"} />
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCents(total)}</dd>
              </div>
              <SummaryLine label="Includes GST" value={formatCents(Math.round(total / 11))} muted />
            </dl>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Creating…" : paid ? "Create paid invoice" : "Create invoice"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function SummaryLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

/** Past customers from orders, most recent first, one per email; picking one fills in their latest details. */
function CustomerPicker({ orders, onPick }: { orders: AdminOrder[]; onPick: (order: AdminOrder) => void }) {
  const [open, setOpen] = useState(false);
  const seen = new Set<string>();
  const latest = orders.filter((o) => {
    const email = o.customer.email.toLowerCase();
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between font-normal text-muted-foreground">
          <span className="flex items-center gap-2">
            <UserRound /> Choose an existing customer
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search by name or email" />
          <CommandList>
            <CommandEmpty>No customers match.</CommandEmpty>
            <CommandGroup>
              {latest.map((o) => (
                <CommandItem
                  key={o.customer.email}
                  value={`${o.customer.name} ${o.customer.email}`}
                  onSelect={() => {
                    onPick(o);
                    setOpen(false);
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate">{o.customer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.customer.email} · {o.shipTo.suburb} {o.shipTo.state}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Searchable product list; products already on the invoice are hidden. */
function ProductAdder({ products, taken, onAdd }: { products: AdminProduct[]; taken: Set<string>; onAdd: (p: AdminProduct) => void }) {
  const [open, setOpen] = useState(false);
  const available = products.filter((p) => !taken.has(p.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full border-dashed">
          <Plus /> Add product
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search by name, SKU or brand" />
          <CommandList>
            <CommandEmpty>No products match.</CommandEmpty>
            <CommandGroup>
              {available.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.sku} ${p.brand} ${p.id}`}
                  disabled={p.stock === 0}
                  onSelect={() => {
                    onAdd(p);
                    setOpen(false);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="size-8 shrink-0 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                      {p.status === "draft" && " · Draft"}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{formatCents(catalogueCents(p))}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
