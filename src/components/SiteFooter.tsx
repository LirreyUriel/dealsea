import Link from "next/link";
import { allSeoRoutes } from "@/lib/seo-routes";
import { SITE_DESCRIPTION, SITE_NAME_HE } from "@/lib/site";

export function SiteFooter() {
  const routes = allSeoRoutes();
  const cities = routes.filter((route) => route.kind === "city");
  const chains = routes.filter((route) => route.kind === "chain");
  const more = routes.filter((route) => route.kind === "audience" || route.kind === "weekend");

  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <p className="font-display text-lg font-semibold text-ink">{SITE_NAME_HE}</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{SITE_DESCRIPTION}</p>
        </div>
        <NavColumn title="יעדים" routes={cities} />
        <NavColumn title="רשתות" routes={chains} />
        <NavColumn title="עוד דילים" routes={more} />
      </div>
    </footer>
  );
}

function NavColumn({ title, routes }: { title: string; routes: { slug: string; h1: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="mt-3 space-y-1.5">
        {routes.map((route) => (
          <li key={route.slug}>
            <Link
              href={`/deals/${encodeURIComponent(route.slug)}`}
              className="text-sm text-ink-soft transition hover:text-sea"
            >
              {route.h1}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
