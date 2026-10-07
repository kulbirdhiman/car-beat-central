import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AdminError } from "./admin/validate";

/** Formats next/image can optimise. SVG is left out: it can carry scripts and next/image blocks it anyway. */
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Where uploads are filed in the bucket, one folder per kind of image. */
export const IMAGE_FOLDERS = ["products", "departments", "offers"] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

const bucket = () => process.env.SUPABASE_STORAGE_BUCKET || "images";

let client: SupabaseClient | null = null;

/** A server-side client with the service role key, so uploads skip row-level security. Never sent to the browser. */
function supabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new AdminError("Image uploads are off. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.", 503);
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Uploads an image to the public bucket under a random name and returns its public https URL. */
export async function uploadImage(file: File, folder: ImageFolder): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new AdminError("Upload a JPG, PNG, WebP, AVIF or GIF image.");
  if (file.size === 0) throw new AdminError("That file is empty.");
  if (file.size > MAX_IMAGE_BYTES) throw new AdminError("Images must be 5 MB or smaller.");

  const path = `${folder}/${randomUUID()}.${ext}`;
  const storage = supabase().storage.from(bucket());
  const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("Supabase upload failed", error);
    throw new AdminError(`The image couldn't be uploaded: ${error.message}`, 502);
  }
  return storage.getPublicUrl(path).data.publicUrl;
}
