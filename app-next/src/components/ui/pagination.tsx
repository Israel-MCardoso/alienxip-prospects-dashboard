"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage = 10,
  onPageChange,
  className
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  };

  const handlePageClick = (page: number, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  // Generate page range to show around current page
  const range: number[] = [];
  const maxVisiblePages = 5;
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + maxVisiblePages - 1);
  if (end - start < maxVisiblePages - 1) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }
  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems || currentPage * perPage);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4 font-mono text-[11px] text-muted-foreground border-t border-white/5", className)}>
      <div>
        {totalItems !== undefined ? (
          <span>Exibindo {startItem}–{endItem} de {totalItems} registros</span>
        ) : (
          <span>Página {currentPage} de {totalPages}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Anterior */}
        {currentPage > 1 ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            onClick={(e) => handlePageClick(currentPage - 1, e)}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-white/5 bg-background px-3 hover:bg-muted text-foreground transition-all duration-200"
          >
            <ChevronLeftIcon className="size-3.5 mr-1 shrink-0" />
            Anterior
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex h-8 items-center justify-center rounded-lg border border-white/5 bg-background/50 px-3 text-muted-foreground/30 cursor-not-allowed"
          >
            <ChevronLeftIcon className="size-3.5 mr-1 shrink-0" />
            Anterior
          </button>
        )}

        {/* Page numbers */}
        {range.map((page) => {
          const active = page === currentPage;
          return (
            <Link
              key={page}
              href={getPageUrl(page)}
              onClick={(e) => handlePageClick(page, e)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
                active
                  ? "bg-primary border-primary text-primary-foreground font-bold shadow-sm"
                  : "border-white/5 bg-background hover:bg-muted text-foreground"
              )}
            >
              {page}
            </Link>
          );
        })}

        {/* Próxima */}
        {currentPage < totalPages ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            onClick={(e) => handlePageClick(currentPage + 1, e)}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-white/5 bg-background px-3 hover:bg-muted text-foreground transition-all duration-200"
          >
            Próxima
            <ChevronRightIcon className="size-3.5 ml-1 shrink-0" />
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex h-8 items-center justify-center rounded-lg border border-white/5 bg-background/50 px-3 text-muted-foreground/30 cursor-not-allowed"
          >
            Próxima
            <ChevronRightIcon className="size-3.5 ml-1 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
