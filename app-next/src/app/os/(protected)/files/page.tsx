import { FilesPageView } from "@/features/knowledge/files-page";
import { getFiles } from "@/features/knowledge/data";

export default async function FilesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; entity_type?: string; file_type?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const page = parseInt(filters.page || "1", 10);
  const { data, error } = await getFiles(filters);

  const itemsPerPage = 10;
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedFiles = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <FilesPageView
      files={paginatedFiles}
      error={error}
      initialFilters={filters}
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
    />
  );
}
