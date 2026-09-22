// Owner must set NEXT_PUBLIC_SITE_URL to the real production domain once known — used for
// metadataBase, the sitemap, and robots.txt. The fallback below is a placeholder, not a real
// domain, so metadata/sitemap/robots are structurally correct but need this env var to be
// accurate once deployed.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smart-tech.example.com";
export const SITE_NAME = "Smart Tech";
