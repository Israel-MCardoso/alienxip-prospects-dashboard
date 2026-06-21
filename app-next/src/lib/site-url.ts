export function getPublicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function buildPublicUrl(path: string) {
  const siteUrl = getPublicSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return siteUrl ? `${siteUrl}${normalizedPath}` : normalizedPath;
}
