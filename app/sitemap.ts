import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

// Single-page marketing site with in-page anchors (/#services, /#about, etc.) — /login and
// /dashboard/* are authenticated/non-content routes and shouldn't be indexed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
