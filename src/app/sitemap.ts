import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/sample-report`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/ai-seo`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/ai-seo/audit`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/ai-seo/what-is-ai-seo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/ai-seo/checklist`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refunds`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
