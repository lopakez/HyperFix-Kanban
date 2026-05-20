import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://hyperfix.hypeer.cloud/sitemap.xml",
    host: "https://hyperfix.hypeer.cloud",
  };
}
