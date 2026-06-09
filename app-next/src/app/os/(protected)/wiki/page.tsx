import { getWikiPages } from "@/features/knowledge/data";
import { WikiList } from "@/features/knowledge/wiki-pages";

export default async function WikiPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; status?: string }> }) {
  const filters = await searchParams;
  const { data, error } = await getWikiPages(filters);
  return <WikiList pages={data} error={error} />;
}
