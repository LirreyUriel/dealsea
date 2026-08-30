import { dealBookingUrl } from "@/lib/booking-url";
import { dealCity } from "@/lib/deal-tags";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Deal } from "@/lib/types";

export function DealJsonLd({ deals, pageUrl, name }: { deals: Deal[]; pageUrl: string; name: string }) {
  const offers = deals.slice(0, 30).map((deal) => ({
    "@type": "Offer",
    name: `${deal.hotelName} — ${deal.title}`,
    url: dealBookingUrl(deal),
    priceCurrency: "ILS",
    ...(deal.pricePerNight && deal.pricePerNight > 0 ? { price: deal.pricePerNight } : {}),
    availability: "https://schema.org/InStock",
    validFrom: deal.validFrom ?? undefined,
    priceValidUntil: deal.validTo ?? undefined,
    seller: { "@type": "Organization", name: deal.chainName },
    itemOffered: {
      "@type": "Hotel",
      name: deal.hotelName,
      image: deal.imageUrl || deal.cityImageUrl ? `${SITE_URL}${deal.imageUrl || deal.cityImageUrl}` : `${SITE_URL}/logo.png`,
      address: dealCity(deal) ? { "@type": "PostalAddress", addressLocality: dealCity(deal), addressCountry: "IL" } : undefined,
    },
  }));

  const json = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    inLanguage: "he",
    url: pageUrl,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "he" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: deals.length,
      itemListElement: offers.map((offer, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: offer,
      })),
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
