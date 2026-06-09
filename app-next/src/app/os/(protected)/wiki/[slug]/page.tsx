import { notFound } from "next/navigation";

import { getWikiPageBySlug } from "@/features/knowledge/data";
import { WikiDetail } from "@/features/knowledge/wiki-pages";

export default async function WikiDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await getWikiPageBySlug(slug);
  if (!data) notFound();
  return <WikiDetail page={data} />;
}
