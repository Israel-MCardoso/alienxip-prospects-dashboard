import { getPlaybooks } from "@/features/knowledge/data";
import { PlaybooksPageView } from "@/features/knowledge/playbooks-page";

export default async function PlaybooksPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; status?: string; review_status?: string }> }) {
  const filters = await searchParams;
  const { data, error } = await getPlaybooks(filters);
  return <PlaybooksPageView playbooks={data} error={error} />;
}
