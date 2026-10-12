"use client";

import { Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition, type ReactElement, type ReactNode } from "react";
import { toast } from "sonner";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "@/app/(store)/account/actions";
import type { FormState } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AU_STATES } from "@/lib/data";
import type { SavedAddress } from "@/lib/server/account";
import { cn } from "@/lib/utils";

export function AddressCard({ address }: { address: SavedAddress }) {
  const [pending, start] = useTransition();
  const run = (action: () => Promise<void>, done: string) =>
    start(async () => {
      await action();
      toast.success(done);
    });

  return (
    <li className={cn("flex flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/[0.07]", address.isDefault && "ring-2 ring-primary", pending && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{address.name}</p>
        {address.isDefault && <Badge className="border-transparent bg-primary/10 text-primary">Default</Badge>}
      </div>
      <address className="mt-2 flex-1 text-sm not-italic text-muted-foreground">
        {address.address}
        <br />
        {address.suburb} {address.state} {address.postcode}
        <br />
        {address.phone}
      </address>
      <div className="mt-4 flex flex-wrap gap-2">
        <AddressDialog
          address={address}
          trigger={
            <Button size="sm" variant="outline" disabled={pending}>
              <Pencil /> Edit
            </Button>
          }
        />
        {!address.isDefault && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setDefaultAddressAction(address.id), "Default address updated")}>
            <Star /> Make default
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete the address at ${address.address}?`)) run(() => deleteAddressAction(address.id), "Address deleted");
          }}
        >
          <Trash2 /> Delete
        </Button>
      </div>
    </li>
  );
}

/** Add an address, or edit `address`. The form lives inside the dialog, so it starts fresh each time it opens. */
export function AddressDialog({ address, trigger }: { address?: SavedAddress; trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? "Edit address" : "Add an address"}</DialogTitle>
          <DialogDescription>We deliver Australia-wide.</DialogDescription>
        </DialogHeader>
        <AddressForm
          address={address}
          onSaved={() => {
            setOpen(false);
            toast.success(address ? "Address updated" : "Address saved");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddressForm({ address, onSaved }: { address?: SavedAddress; onSaved: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, form) => {
    const result = await saveAddressAction(prev, form);
    if (result.ok) onSaved();
    return result;
  }, {});
  const v = state.values ?? address ?? {};
  const errors = state.errors ?? {};
  const [auState, setAuState] = useState(address?.state ?? "");

  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-6">
      {address && <input type="hidden" name="id" value={address.id} />}
      {state.message && !state.ok && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive sm:col-span-6">
          {state.message}
        </p>
      )}
      <Field label="Full name" name="name" error={errors.name} className="sm:col-span-3">
        <Input id="name" name="name" defaultValue={v.name} aria-invalid={!!errors.name} autoComplete="name" required />
      </Field>
      <Field label="Mobile" name="phone" error={errors.phone} className="sm:col-span-3">
        <Input id="phone" name="phone" defaultValue={v.phone} aria-invalid={!!errors.phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="0412 345 678" required />
      </Field>
      <Field label="Street address" name="address" error={errors.address} className="sm:col-span-6">
        <Input id="address" name="address" defaultValue={v.address} aria-invalid={!!errors.address} autoComplete="street-address" required />
      </Field>
      <Field label="Suburb" name="suburb" error={errors.suburb} className="sm:col-span-3">
        <Input id="suburb" name="suburb" defaultValue={v.suburb} aria-invalid={!!errors.suburb} autoComplete="address-level2" required />
      </Field>
      <Field label="State" name="state" error={errors.state} className="sm:col-span-1">
        <Select name="state" required value={auState} onValueChange={setAuState}>
          <SelectTrigger id="state" className="w-full" aria-invalid={!!errors.state}>
            <SelectValue placeholder="—" />
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
      <Field label="Postcode" name="postcode" error={errors.postcode} className="sm:col-span-2">
        <Input id="postcode" name="postcode" defaultValue={v.postcode} aria-invalid={!!errors.postcode} autoComplete="postal-code" inputMode="numeric" maxLength={4} required />
      </Field>
      {!address?.isDefault && (
        <Label className="flex items-center gap-2 font-normal sm:col-span-6">
          <Checkbox name="default" /> Make this my default address
        </Label>
      )}
      <Button type="submit" size="lg" className="sm:col-span-6" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {address ? "Save changes" : "Save address"}
      </Button>
    </form>
  );
}

function Field({ label, name, error, className, children }: { label: string; name: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
