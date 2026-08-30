import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_NAME_HE, SITE_URL } from "@/lib/site";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#007791",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME_HE} | ${SITE_NAME} — מבצעי מלונות בישראל`,
    template: `%s | ${SITE_NAME_HE}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME_HE,
  keywords: [
    "דילסי",
    "DealSea",
    "מבצעי מלונות",
    "דילים למלונות",
    "ישרוטל",
    "פתאל",
    "בראון",
    "אטלס",
    "דן",
    "חופשה בישראל",
    "מלונות אילת",
    "ים המלח",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "travel",
  alternates: {
    canonical: "/",
    languages: { "he-IL": "/", he: "/" },
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME_HE} | מבצעי מלונות בישראל`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/logo.png", alt: SITE_NAME_HE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME_HE} | מבצעי מלונות בישראל`,
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
  other: {
    "geo.region": "IL",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className="font-sans antialiased">
        <SiteJsonLd />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
