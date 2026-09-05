export const DEFAULT_SITE_URL = "https://www.youssefabaali.com";

/**
 * Ensures any image or asset path is resolved to a complete, absolute URL
 * starting with https://...
 * Supports relative paths (/uploads/..., uploads/..., assets/..., etc.),
 * and leaves existing full URLs (https://..., http://...) unchanged.
 */
export function toAbsoluteUrl(url?: string, siteUrl: string = DEFAULT_SITE_URL): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Already a full absolute URL with protocol
  if (/^(?:https?:)?\/\//i.test(trimmed)) {
    if (trimmed.startsWith("//")) {
      return `https:${trimmed}`;
    }
    return trimmed;
  }

  // Base64 or Blob data URL
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const cleanBase = (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return `${cleanBase}${cleanPath}`;
}
