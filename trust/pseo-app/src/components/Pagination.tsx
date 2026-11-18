import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g. "/designs"
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (p: number) => {
    if (p === 1) return basePath;
    return `${basePath}/page/${p}`;
  };

  const pages: (number | string)[] = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - delta - 1 && i > 1) ||
      (i === currentPage + delta + 1 && i < totalPages)
    ) {
      pages.push('...');
    }
  }

  const dedupedPages = pages.filter((item, index) => {
    if (item === '...' && pages[index - 1] === '...') return false;
    return true;
  });

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-12 mb-8 flex-wrap">
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          ← Previous
        </Link>
      ) : (
        <span className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed">
          ← Previous
        </span>
      )}

      {dedupedPages.map((item, idx) => {
        if (item === '...') {
          return (
            <span key={`dots-${idx}`} className="px-3 py-2 text-slate-400 text-sm">
              …
            </span>
          );
        }
        const pageNum = item as number;
        const isActive = pageNum === currentPage;
        return (
          <Link
            key={pageNum}
            href={getPageUrl(pageNum)}
            aria-current={isActive ? 'page' : undefined}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
              isActive
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            {pageNum}
          </Link>
        );
      })}

      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Next →
        </Link>
      ) : (
        <span className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed">
          Next →
        </span>
      )}
    </nav>
  );
}
