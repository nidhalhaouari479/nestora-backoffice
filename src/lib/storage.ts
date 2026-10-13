import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const MEDIA_BUCKET = "nestora-media";
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function validatePhoto(file: File) {
  if (!ALLOWED_TYPES[file.type]) return "Formats acceptés : JPG, PNG ou WebP.";
  if (file.size > MAX_PHOTO_BYTES) return "Chaque photo doit faire moins de 3 Mo.";
  return null;
}

// Uploads with the service role after the caller's permission was checked; returns the public URL.
export async function uploadPhoto(folder: "listings" | "universities", file: File) {
  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ALLOWED_TYPES[file.type]}`;
  const storage = getSupabaseAdmin().storage.from(MEDIA_BUCKET);
  const { error } = await storage.upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) throw new Error(`Upload impossible : ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}
