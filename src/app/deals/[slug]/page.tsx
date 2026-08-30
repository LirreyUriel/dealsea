import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { resolveSeoRoute } from "@/lib/seo-routes";
import { absoluteUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = resolveSeoRoute(slug);
  if (!route) return {};
  const canonical = `/deals/${encodeURIComponent(route.slug)}`;
  return {
    title: route.title,
    description: route.description,
    alternates: { canonical: absoluteUrl(canonical) },
    openGraph: {
      title: route.title,
      description: route.description,
      locale: "he_IL",
      url: absoluteUrl(canonical),
    },
  };
}

export default async function DealLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const route = resolveSeoRoute(slug);
  if (!route) notFound();
  if (decodeURIComponent(slug) !== route.slug) {
    permanentRedirect(`/deals/${route.slug}`);
  }

  return (
    <Dashboard pagePath={`/deals/${route.slug}`} initialFilters={route.filters} />
  );
}
