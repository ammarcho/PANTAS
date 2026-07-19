import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Shared Supabase client (browser + server components).
 *
 * `null` when env vars are absent — every caller falls back to the offline
 * demo data that shipped with the frontend, so the app keeps working without
 * a backend exactly as before (docs/BACKEND.md: demo untuk juri tetap jalan).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient<Database> | null =
  url && key ? createClient<Database>(url, key) : null;

export const isSupabaseConfigured = supabase !== null;

/**
 * Upload a camera capture (data URL) to the `panen` bucket under the user's
 * folder. Returns the public URL, or null when not configured / upload fails
 * (callers keep the local data URL in that case).
 */
export async function uploadCapture(
  dataUrl: string,
  userId: string,
): Promise<string | null> {
  if (!supabase || !dataUrl.startsWith("data:")) return null;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${userId}/panen-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("panen").upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    return supabase.storage.from("panen").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.warn("[pantas] unggah capture gagal, pakai data URL lokal:", e);
    return null;
  }
}
