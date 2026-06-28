import { createClient } from "@/lib/supabase/client";

const ORG_LOGOS_BUCKET = "org-logos";
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

const MIME_TO_EXT: Record<(typeof ACCEPTED_LOGO_TYPES)[number], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function getLogoExtension(file: File): string | null {
  if (ACCEPTED_LOGO_TYPES.includes(file.type as (typeof ACCEPTED_LOGO_TYPES)[number])) {
    return MIME_TO_EXT[file.type as (typeof ACCEPTED_LOGO_TYPES)[number]];
  }
  return null;
}

export async function uploadOrgLogo(orgId: string, file: File): Promise<string> {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type as (typeof ACCEPTED_LOGO_TYPES)[number])) {
    throw new Error("Logo must be a PNG, JPG, WebP, or SVG file.");
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error("Logo must be 2 MB or smaller.");
  }

  const extension = getLogoExtension(file);
  if (!extension) {
    throw new Error("Logo must be a PNG, JPG, WebP, or SVG file.");
  }

  const supabase = createClient();
  const path = `${orgId}/logo.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(ORG_LOGOS_BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(ORG_LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
