import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { BreadcrumbJsonLd } from "@/components/SiteJsonLd";
import { allSeoRoutes, resolveSeoRoute } from "@/lib/seo-routes";
import { absoluteUrl, SITE_NAME, SITE_NAME_HE } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allSeoRoutes().map((route) => ({ slug: route.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = resolveSeoRoute(slug);
  if (!route) return {};
  const path = `/deals/${encodeURIComponent(route.slug)}`;
  const title = route.title;
  return {
    title,
    description: route.description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: `${title} | ${SITE_NAME_HE}`,
      description: route.description,
      locale: "he_IL",
      siteName: SITE_NAME,
      type: "website",
      url: absoluteUrl(path),
      images: [{ url: "/logo.png", alt: SITE_NAME_HE }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME_HE}`,
      description: route.description,
      images: ["/logo.png"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function DealLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const route = resolveSeoRoute(slug);
  if (!route) notFound();
  if (decodeURIComponent(slug) !== route.slug) {
    permanentRedirect(`/deals/${route.slug}`);
  }

  const path = `/deals/${route.slug}`;
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: SITE_NAME_HE, url: absoluteUrl("/") },
          { name: route.h1, url: absoluteUrl(path) },
        ]}
      />
      <Dashboard pagePath={path} initialFilters={route.filters} />
    </>
  );
}
