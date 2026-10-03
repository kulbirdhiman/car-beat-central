"use client";

import { CircleCheck, Loader2, PenLine, Star } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";
import { submitReview, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGarage } from "@/lib/garage";
import { cn } from "@/lib/utils";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/** "Write a review" toggle and form. On success it shows a thank-you; the page revalidates with the new review. */
export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, {});
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const { car } = useGarage();
  const errors = state.errors ?? {};
  const v = state.values ?? {};
  const shown = hover || rating || Number(v.rating) || 0;

  if (state.ok) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-5 text-sm animate-in fade-in">
        <CircleCheck className="size-5 shrink-0 text-success" />
        {state.message}
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="xl" variant="ink" className="w-full rounded-xl" onClick={() => setOpen(true)}>
        <PenLine /> Write a review
      </Button>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-4 rounded-2xl border bg-card p-5 animate-in fade-in slide-in-from-top-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating || v.rating || ""} />
      <p className="font-display text-lg font-bold">Write a review</p>
      {state.message && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {state.message}
        </p>
      )}

      <Field label="Your rating" error={errors.rating}>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="rounded p-0.5 transition-transform hover:scale-110"
            >
              <Star className={cn("size-7", n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-muted-foreground">{RATING_WORDS[shown]}</span>
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={errors.name} htmlFor="review-name">
          <Input id="review-name" name="name" autoComplete="given-name" defaultValue={v.name} aria-invalid={!!errors.name} />
        </Field>
        <Field label="Your vehicle (optional)" htmlFor="review-vehicle">
          <Input
            id="review-vehicle"
            name="vehicle"
            placeholder="e.g. Toyota HiLux"
            defaultValue={v.vehicle ?? (car ? `${car.brand.name} ${car.model.name}` : "")}
          />
        </Field>
      </div>
      <Field label="Title" error={errors.title} htmlFor="review-title">
        <Input id="review-title" name="title" placeholder="Sum it up in a few words" defaultValue={v.title} aria-invalid={!!errors.title} />
      </Field>
      <Field label="Your review" error={errors.body} htmlFor="review-body">
        <Textarea id="review-body" name="body" rows={4} placeholder="How was the fit, the sound, the install?" defaultValue={v.body} aria-invalid={!!errors.body} />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" size="xl" className="flex-1 rounded-xl" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Post review
        </Button>
        <Button type="button" size="xl" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
