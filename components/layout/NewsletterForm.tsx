"use client";

import { Check, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { subscribe, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function NewsletterForm({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, {});

  if (state.ok) {
    return (
      <p className={cn("flex items-center gap-2 text-sm animate-in fade-in", tone === "dark" ? "text-white" : "text-foreground", className)}>
        <Check className="size-4 text-primary" /> {state.message}
      </p>
    );
  }

  return (
    <form action={action} className={cn("max-w-sm", className)} noValidate>
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          defaultValue={state.values?.email}
          required
          placeholder="you@example.com"
          aria-label="Email address"
          aria-invalid={!!state.errors?.email}
          className={cn("h-11 px-3.5", tone === "dark" && "border-white/15 bg-white/5 text-white placeholder:text-white/35")}
        />
        <Button type="submit" disabled={pending} variant={tone === "dark" ? "outline" : "default"}
          className={cn("h-11 px-5", tone === "dark" && "border-white/15 bg-white text-foreground hover:bg-white/85")}>
          {pending ? <Loader2 className="animate-spin" /> : "Subscribe"}
        </Button>
      </div>
      {state.errors?.email && <p className="mt-2 text-xs text-destructive">{state.errors.email}</p>}
    </form>
  );
}
