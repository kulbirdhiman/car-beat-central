"use client";

import { ImageUp, Loader2, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Upload several product photos at once, then keep their previews together in the editor. */
export function MultiImageUpload({ images, onChange, maxImages = 24 }: { images: string[]; onChange: (images: string[]) => void; maxImages?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function uploadFiles(files: File[]) {
    const remaining = maxImages - images.length;
    if (remaining <= 0) return setError(`You can add up to ${maxImages} additional photos.`);
    const selected = files.slice(0, remaining);
    const uploaded: string[] = [];
    const errors: string[] = [];
    setError("");
    setUploading(true);
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
      if (uploaded.length) onChange([...images, ...uploaded]);
      if (files.length > remaining) errors.push(`Only the first ${remaining} photos were selected; the limit is ${maxImages}.`);
      setError(errors.join(" "));
    } finally {
      setProgress("");
      setUploading(false);
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
      setError(`You can add up to ${maxImages} additional photos.`);
      return;
    }
    setError("");
    onChange([...images, value]);
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
            <p className="text-sm font-medium">{images.length} of {maxImages} additional photos</p>
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
          <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Or paste an image URL" aria-label="Additional image URL" disabled={uploading || images.length >= maxImages} />
          <Button type="button" variant="secondary" onClick={addUrl} disabled={uploading || !url.trim() || images.length >= maxImages}>
            <Plus /> Add URL
          </Button>
        </div>
      </div>
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {images.map((image, index) => (
            <li key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`Product photo ${index + 2}`} className="size-full object-contain p-2" />
              <span className="absolute bottom-1 left-1 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-medium text-white">Photo {index + 2}</span>
              <Button type="button" variant="secondary" size="icon-sm" aria-label={`Remove photo ${index + 2}`} className="absolute right-1 top-1 size-7 rounded-full shadow" disabled={uploading} onClick={() => onChange(images.filter((_, i) => i !== index))}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}
