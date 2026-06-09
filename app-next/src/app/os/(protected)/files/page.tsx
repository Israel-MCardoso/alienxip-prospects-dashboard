import { FilesPageView } from "@/features/knowledge/files-page";
import { getFiles } from "@/features/knowledge/data";

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ q?: string; entity_type?: string; file_type?: string }> }) {
  const filters = await searchParams;
  const { data, error } = await getFiles(filters);
  return <FilesPageView files={data} error={error} />;
}
