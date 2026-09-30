"use client";

import { CalendarCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { bookFitting, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FITTING_CITIES } from "@/lib/data";
import { useGarage } from "@/lib/garage";

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

export function BookingForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(bookFitting, {});
  const { car } = useGarage();
  const [city, setCity] = useState("");
  const errors = state.errors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="self-start rounded-xl bg-card p-10 text-center ring-1 ring-foreground/[0.07] animate-in fade-in zoom-in-95">
        <span className="mx-auto grid size-14 place-items-center rounded-lg bg-success/10">
          <CalendarCheck className="size-6 text-success" />
        </span>
        <h2 className="mt-4 font-display text-4xl font-bold">Booking request sent</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">{state.message}</p>
        <Button asChild size="lg" className="mt-6 h-10 px-4">
          <Link href="/shop">Shop parts while you wait</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid content-start gap-5 self-start rounded-xl bg-card p-6 ring-1 ring-foreground/[0.07] sm:grid-cols-2 sm:p-8">
      {state.message && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive sm:col-span-2">
          {state.message}
        </p>
      )}
      <Field label="Your name" error={errors.name} htmlFor="name">
        <Input id="name" name="name" autoComplete="name" defaultValue={v.name} aria-invalid={!!errors.name} />
      </Field>
      <Field label="Mobile" error={errors.phone} htmlFor="phone">
        <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0412 345 678" defaultValue={v.phone} aria-invalid={!!errors.phone} />
      </Field>
      <Field label="Email" error={errors.email} htmlFor="email" className="sm:col-span-2">
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} aria-invalid={!!errors.email} />
      </Field>
      <Field label="Vehicle" error={errors.vehicle} htmlFor="vehicle">
        <Input
          id="vehicle"
          name="vehicle"
          placeholder="e.g. 2021 Toyota HiLux"
          // Prefill from the shopper's garage when we know their car.
          key={car?.model.id ?? "none"}
          defaultValue={v.vehicle || (car ? `${car.brand.name} ${car.model.name}` : "")}
          aria-invalid={!!errors.vehicle}
        />
      </Field>
      <Field label="City" error={errors.city} htmlFor="city">
        <Select name="city" value={city || v.city || ""} onValueChange={setCity}>
          <SelectTrigger id="city" className="h-11! w-full" aria-invalid={!!errors.city}>
            <SelectValue placeholder="Choose a city" />
          </SelectTrigger>
          <SelectContent>
            {FITTING_CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Preferred date" error={errors.date} htmlFor="date" hint="Monday to Saturday">
        <Input id="date" name="date" type="date" min={tomorrow()} suppressHydrationWarning defaultValue={v.date} aria-invalid={!!errors.date} />
      </Field>
      <Field label="What are we fitting? (optional)" htmlFor="notes" className="sm:col-span-2">
        <Textarea id="notes" name="notes" rows={4} placeholder="e.g. BeatDeck X9 stereo and front speakers, bought online" defaultValue={v.notes} />
      </Field>
      <Button type="submit" size="xl" disabled={pending} className="sm:col-span-2">
        {pending ? <Loader2 className="animate-spin" /> : <CalendarCheck />}
        {pending ? "Sending…" : "Request booking"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`grid content-start gap-1.5 [&_input]:h-11 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
