import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const CITY_IDS = [
  "bangkok",
  "chiang-mai",
  "delhi",
  "hanoi",
  "jakarta",
  "seoul",
  "beijing",
  "manila",
  "dhaka",
  "kathmandu",
  "ho-chi-minh-city",
  "taipei",
  "singapore",
  "mumbai",
  "ulaanbaatar",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const cityRoutes = CITY_IDS.map((id) => ({
    url:              `${baseUrl}/cities/${id}`,
    lastModified:     new Date(),
    changeFrequency:  "monthly" as const,
    priority:         0.8,
  }));

  return [
    {
      url:             baseUrl,
      lastModified:    new Date(),
      changeFrequency: "monthly" as const,
      priority:        1.0,
    },
    {
      url:             `${baseUrl}/about`,
      lastModified:    new Date(),
      changeFrequency: "monthly" as const,
      priority:        0.6,
    },
    ...cityRoutes,
  ];
}
