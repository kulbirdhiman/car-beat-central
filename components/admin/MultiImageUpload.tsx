"use client";

import { ArrowLeft, ArrowRight, GripVertical, ImageUp, Loader2, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Upload several product photos at once, then keep their previews together in the editor. */
export function MultiImageUpload({ images, onChange, onUploadingChange, maxImages = 25 }: { images: string[]; onChange: (images: string[]) => void; onUploadingChange?: (uploading: boolean) => void; maxImages?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function uploadFiles(files: File[]) {
    if (!files.length || uploading) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) return setError(`You can add up to ${maxImages} photos.`);
    const selected = files.slice(0, remaining);
    const uploaded: string[] = [];
    const errors: string[] = [];
    setError("");
    setUploading(true);
    onUploadingChange?.(true);
    try {
      for (const [index, file] of selected.entries()) {
        setProgress(`Uploading ${index + 1} of ${selected.length}…`);
        if (!ACCEPT.includes(file.type)) {
          errors.push(`${file.name}: use JPG, PNG, WebP, AVIF or GIF.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          errors.push(`${file.name}: images must be 5 MB or smaller.`);
          continue;
        }
        try {
          const body = new FormData();
          body.append("file", file);
          body.append("folder", "products");
          const response = await fetch("/api/admin/uploads", { method: "POST", body, cache: "no-store" });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error ?? `Upload failed (${response.status}).`);
          uploaded.push(data.url as string);
        } catch (uploadError) {
          errors.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : "Upload failed."}`);
        }
      }
      if (uploaded.length) onChange([...new Set([...images, ...uploaded])]);
      if (files.length > remaining) errors.push(`Only the first ${remaining} photos were selected; the limit is ${maxImages}.`);
      setError(errors.join(" "));
    } finally {
      setProgress("");
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  function addUrl() {
    const value = url.trim();
    if (!value) return;
    if (!value.startsWith("/") && !/^https:\/\/\S+$/.test(value)) {
      setError("Use a site path starting with / or an HTTPS image URL.");
      return;
    }
    if (images.length >= maxImages) {
      setError(`You can add up to ${maxImages} photos.`);
      return;
    }
    setError("");
    onChange([...new Set([...images, value])]);
    setUrl("");
  }

  return (
    <div className="grid gap-3">
      <div
        className={cn("rounded-xl border border-dashed p-4 transition-colors", uploading && "bg-muted/30", images.length >= maxImages && "opacity-60")}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!uploading) void uploadFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{images.length} of {maxImages} photos</p>
            <p className="text-xs text-muted-foreground">Select or drop several images at once. JPG, PNG, WebP, AVIF or GIF, up to 5 MB each.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={uploading || images.length >= maxImages}>
            {uploading ? <Loader2 className="animate-spin" /> : <ImageUp />}
            {uploading ? progress || "Uploading" : "Upload photos"}
          </Button>
          <input
            ref={input}
            type="file"
            accept={ACCEPT.join(",")}
            multiple
            hidden
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length) void uploadFiles(files);
            }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Or paste an image URL" aria-label="Image URL" disabled={uploading || images.length >= maxImages} />
          <Button type="button" variant="secondary" onClick={addUrl} disabled={uploading || !url.trim() || images.length >= maxImages}>
            <Plus /> Add URL
          </Button>
        </div>
      </div>
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id || uploading) return;
          const from = images.indexOf(String(active.id));
          const to = images.indexOf(String(over.id));
          if (from >= 0 && to >= 0) onChange(arrayMove(images, from, to));
        }}>
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image, index) => (
                <SortablePhoto key={image} image={image} index={index} count={images.length} disabled={uploading}
                  onMove={(to) => onChange(arrayMove(images, index, to))}
                  onRemove={() => onChange(images.filter((_, i) => i !== index))} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

function SortablePhoto({ image, index, count, disabled, onMove, onRemove }: {
  image: string; index: number; count: number; disabled: boolean;
  onMove: (index: number) => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image, disabled });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative rounded-lg border bg-background p-2", index === 0 && "border-primary", isDragging && "z-10 opacity-70 shadow-lg")}>
      <div className="relative aspect-square bg-muted/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={`Product photo ${index + 1}`} draggable={false} className="size-full object-contain p-2" />
        <Button type="button" variant="secondary" size="icon-sm" className="absolute left-1 top-1 touch-none cursor-grab active:cursor-grabbing"
          aria-label={`Reorder photo ${index + 1}`} disabled={disabled} {...attributes} {...listeners}><GripVertical /></Button>
        <Button type="button" variant="secondary" size="icon-sm" aria-label={`Remove photo ${index + 1}`}
          className="absolute right-1 top-1" disabled={disabled} onClick={onRemove}><X /></Button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-xs font-medium">{index === 0 ? "Hero image" : `Photo ${index + 1}`}</span>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move photo ${index + 1} earlier`} disabled={disabled || index === 0} onClick={() => onMove(index - 1)}><ArrowLeft /></Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move photo ${index + 1} later`} disabled={disabled || index === count - 1} onClick={() => onMove(index + 1)}><ArrowRight /></Button>
        </div>
      </div>
      {index > 0 && <Button type="button" variant="outline" size="sm" className="mt-1 w-full" disabled={disabled} onClick={() => onMove(0)}>Make hero</Button>}
    </li>
  );
}
