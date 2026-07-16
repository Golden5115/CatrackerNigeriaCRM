'use client'

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null; // Don't show if there's only 1 page

  // Logic to show a reasonable number of page links
  const getVisiblePages = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Adjust if we are near the ends
    if (currentPage <= 3) {
      endPage = Math.min(totalPages, 5);
    }
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-xl">
      {/* Mobile View */}
      <div className="flex flex-1 justify-between sm:hidden">
        <Link
          href={createPageURL(currentPage - 1)}
          className={`relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Previous
        </Link>
        <Link
          href={createPageURL(currentPage + 1)}
          className={`relative ml-3 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
        >
          Next
        </Link>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Showing page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
            <Link
              href={createPageURL(currentPage - 1)}
              className={`relative inline-flex items-center rounded-l-lg px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            
            {visiblePages[0] > 1 && (
              <>
                <Link
                  href={createPageURL(1)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  1
                </Link>
                {visiblePages[0] > 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">...</span>
                )}
              </>
            )}

            {visiblePages.map(page => (
              <Link
                key={page}
                href={createPageURL(page)}
                aria-current={currentPage === page ? "page" : undefined}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                  currentPage === page 
                  ? 'z-10 bg-brand-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600' 
                  : 'text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {page}
              </Link>
            ))}

            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">...</span>
                )}
                <Link
                  href={createPageURL(totalPages)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  {totalPages}
                </Link>
              </>
            )}

            <Link
              href={createPageURL(currentPage + 1)}
              className={`relative inline-flex items-center rounded-r-lg px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </nav>

          <form 
            className="ml-6 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const pageNum = Number((e.currentTarget.elements.namedItem('jumpPage') as HTMLInputElement).value);
              if (pageNum >= 1 && pageNum <= totalPages) {
                router.push(createPageURL(pageNum));
              }
            }}
          >
            <span className="text-sm text-gray-500 font-medium">Jump to:</span>
            <input 
              name="jumpPage" 
              type="number" 
              min={1} 
              max={totalPages} 
              defaultValue={currentPage}
              className="w-16 px-2 py-1.5 text-sm font-bold border border-gray-300 rounded-md focus:outline-brand-600 focus:ring-1 focus:ring-brand-600 bg-gray-50 text-center"
            />
            <button 
              type="submit"
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold border border-gray-300 rounded-md transition"
            >
              Go
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}