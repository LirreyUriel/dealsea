import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import { SITE_NAME, SITE_NAME_HE, SITE_URL } from "@/lib/site";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME_HE} | ${SITE_NAME} — מבצעי מלונות בישראל`,
    template: `%s | ${SITE_NAME_HE}`,
  },
  description: "לוח מבצעים חיים מרשתות ישרוטל, פתאל, בראון, אטלס, דן, אפריקה ישראל והרברט סמואל. מחירים בשקלים.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    locale: "he_IL",
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
