import { Dashboard } from "@/components/Dashboard";

interface HomePageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q } = await searchParams;
  return <Dashboard initialFilters={q ? { query: q } : undefined} />;
}
