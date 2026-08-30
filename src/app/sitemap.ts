import type { MetadataRoute } from "next";
import { allSeoRoutes } from "@/lib/seo-routes";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const landings = allSeoRoutes().map((route) => ({
    url: `${SITE_URL}/deals/${encodeURIComponent(route.slug)}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: route.kind === "audience" ? 0.9 : 0.8,
  }));

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    ...landings,
  ];
}
