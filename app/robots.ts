import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/signup", "/verify"],
      },
    ],
    sitemap: "https://lowhat.com/sitemap.xml",
  };
}
