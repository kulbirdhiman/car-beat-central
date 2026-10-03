"use client";

import { useState } from "react";
import { Field } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type VehicleLevel = "make" | "model" | "subModel";

export type VehicleFormValues = { name: string; description: string; extra: string };

const LEVEL = {
  make: { title: "make", namePlaceholder: "e.g. BMW", extraLabel: "Country", extraPlaceholder: "e.g. Germany" },
  model: { title: "model", namePlaceholder: "e.g. 3 Series", extraLabel: null, extraPlaceholder: "" },
  subModel: { title: "sub-model", namePlaceholder: "e.g. 320i (G20)", extraLabel: "Years", extraPlaceholder: "e.g. 2019–present" },
} as const;

/** Add/edit dialog for a make (with country), model, or sub-model (with years). */
export function VehicleDialog({
  level,
  initial,
  parent,
  onSave,
  onClose,
}: {
  level: VehicleLevel;
  /** Present when editing. */
  initial?: VehicleFormValues;
  /** Shown in the title, e.g. "BMW 3 Series". */
  parent?: string;
  onSave: (values: VehicleFormValues) => void;
  onClose: () => void;
}) {
  const config = LEVEL[level];
  const [values, setValues] = useState<VehicleFormValues>(initial ?? { name: "", description: "", extra: "" });
  const [error, setError] = useState<string>();
  const set = (key: keyof VehicleFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return setError(`Enter a ${config.title} name.`);
    onSave({ name: values.name.trim(), description: values.description.trim(), extra: values.extra.trim() });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit" : "Add"} {config.title}
          </DialogTitle>
          {parent && <DialogDescription>{parent}</DialogDescription>}
        </DialogHeader>
        <form id="vehicle-form" onSubmit={submit} className="grid gap-4" noValidate>
          <Field id="vf-name" label="Name" error={error}>
            <Input id="vf-name" value={values.name} onChange={set("name")} placeholder={config.namePlaceholder} autoFocus aria-invalid={!!error} />
          </Field>
          <Field id="vf-description" label="Description">
            <Textarea id="vf-description" value={values.description} onChange={set("description")} rows={2} />
          </Field>
          {config.extraLabel && (
            <Field id="vf-extra" label={config.extraLabel}>
              <Input id="vf-extra" value={values.extra} onChange={set("extra")} placeholder={config.extraPlaceholder} />
            </Field>
          )}
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="vehicle-form">
            {initial ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
