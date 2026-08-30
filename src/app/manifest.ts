import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_NAME_HE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME_HE} | ${SITE_NAME}`,
    short_name: SITE_NAME_HE,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#F8F9FA",
    theme_color: "#007791",
    lang: "he",
    dir: "rtl",
    icons: [{ src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
