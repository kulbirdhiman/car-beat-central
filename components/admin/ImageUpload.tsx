"use client";

import { ImageUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * An image field: upload a file (pick or drop it) to Supabase Storage, or type a site path or URL.
 * The uploaded file's public URL becomes the value, saved with the rest of the form.
 */
export function ImageUpload({
  id,
  value,
  onChange,
  folder,
  invalid,
  preview = true,
}: {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  folder: "products" | "departments" | "offers";
  invalid?: boolean;
  /** Off when the form already shows a larger preview. */
  preview?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!ACCEPT.split(",").includes(file.type)) return setError("Upload a JPG, PNG, WebP, AVIF or GIF image.");
    if (file.size > MAX_BYTES) return setError("Images must be 5 MB or smaller.");

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/admin/uploads", { method: "POST", body, cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `The image couldn't be uploaded (error ${res.status}).`);
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image couldn't be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <div
        className={cn("flex items-center gap-3 rounded-lg transition-colors", dragging && "bg-primary/10 ring-2 ring-primary")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && value && <img src={value} alt="" className="size-10 shrink-0 rounded-md object-cover" />}
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Upload, drop, or paste a URL" aria-invalid={invalid} />
        <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading} className="shrink-0">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          {uploading ? "Uploading" : "Upload"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
