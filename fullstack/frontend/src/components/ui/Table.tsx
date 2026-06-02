import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowClassName?: string;
  showIndex?: boolean;
  // Pagination Props
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

export default function Table<T extends { id: number | string }>({
  data = [] as T[],
  columns,
  loading = false,
  emptyMessage = 'Data tidak ditemukan',
  className = '',
  rowClassName = '',
  showIndex = false,
  pagination,
}: TableProps<T>) {
  
  // Calculate index offset based on pagination
  const indexOffset = pagination ? (pagination.currentPage - 1) * pagination.pageSize : 0;

  const tableColumns = showIndex
    ? [
        {
          key: 'index',
          label: 'No',
          className: 'w-12 text-center',
          render: (_: any, __: T, index: number) => (
            <span className="font-bold text-app-text-secondary opacity-50 tabular-nums text-xs">
              {indexOffset + index + 1}
            </span>
          ),
        },
        ...columns,
      ]
    : columns;

  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-app-border">
      {tableColumns.map((_, i) => (
        <td key={i} className="px-6 py-5">
          <div className="h-2.5 bg-app-text-secondary/10 rounded-full w-2/3"></div>
        </td>
      ))}
    </tr>
  );

  // Pagination Helper: Generate page numbers
  const getPageNumbers = () => {
    if (!pagination) return [];
    const { currentPage, totalPages } = pagination;
    const pages: (number | string)[] = [];
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Pagination Info */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-1">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-text-secondary opacity-50">Tampilkan:</span>
              <div className="relative group">
                <select 
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                  className="appearance-none bg-app-surface border border-app-border rounded-xl px-4 py-1.5 pr-8 text-xs font-black text-app-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer transition-all"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size} className="bg-app-surface">{size}</option>
                  ))}
                  <option value={0} className="bg-app-surface font-bold text-primary-600">Semua</option>
                </select>
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-secondary pointer-events-none transition-transform rotate-90" />
              </div>
            </div>
            <div className="h-4 w-px bg-app-border hidden sm:block" />
            <p className="text-xs font-bold text-app-text-secondary">
              <span className="text-app-text-primary">{data.length > 0 ? indexOffset + 1 : 0}</span> - <span className="text-app-text-primary">{indexOffset + data.length}</span> <span className="opacity-50">dari</span> <span className="text-app-text-primary">{pagination.totalItems}</span>
            </p>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className={`w-full overflow-hidden bg-app-surface rounded-2xl sm:rounded-[2rem] border border-app-border premium-shadow ${className}`}>
        <div className="overflow-x-auto -mx-px">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-app-border bg-app-bg/30">
                {tableColumns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-5 text-[11px] font-black uppercase tracking-widest text-app-text-secondary/70 ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: pagination?.pageSize || 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-3xl bg-app-bg flex items-center justify-center">
                        <svg className="h-8 w-8 text-app-text-secondary opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zm0 4h16M7 7h1m2 0h1m2 0h1" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-app-text-secondary opacity-50 uppercase tracking-widest">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr 
                    key={row.id} 
                    className={`group transition-all duration-300 border-b border-app-border last:border-none hover:bg-app-bg/50 ${rowClassName}`}
                  >
                    {tableColumns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-6 py-5 text-sm font-bold text-app-text-primary/90 ${column.className || ''}`}
                      >
                        {column.render 
                          ? column.render(row[column.key as keyof T], row, index) 
                          : (row[column.key as keyof T] !== null && row[column.key as keyof T] !== undefined 
                              ? String(row[column.key as keyof T]) 
                              : '-')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Modern Controls (Floating Bottom) */}
      {pagination && data.length > 0 && (
        <div className="flex items-center justify-center pt-2">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 bg-app-surface border border-app-border rounded-2xl shadow-sm">
            {/* First Page */}
            <button
              type="button"
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="hidden sm:block p-2 rounded-xl text-app-text-secondary hover:bg-app-bg hover:text-primary-500 disabled:opacity-20 disabled:pointer-events-none transition-all"
              title="Halaman Pertama"
            >
              <ChevronsLeft size={18} />
            </button>

            {/* Prev Page */}
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-xl text-app-text-secondary hover:bg-app-bg hover:text-primary-500 disabled:opacity-20 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            
            {/* Page numbers - hidden on mobile, show compact indicator instead */}
            <div className="hidden sm:flex items-center gap-1.5 px-1">
              {getPageNumbers().map((page, i) => (
                page === '...' ? (
                  <div key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-app-text-secondary opacity-30">
                    <MoreHorizontal size={14} />
                  </div>
                ) : (
                  <button
                    key={`page-${page}`}
                    type="button"
                    onClick={() => pagination.onPageChange(Number(page))}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all duration-300 ${
                      pagination.currentPage === page
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-110'
                        : 'text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary active:scale-95'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            {/* Mobile: compact page indicator */}
            <span className="sm:hidden text-xs font-black text-app-text-primary px-2 tabular-nums">
              {pagination.currentPage} / {pagination.totalPages}
            </span>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-xl text-app-text-secondary hover:bg-app-bg hover:text-primary-500 disabled:opacity-20 disabled:pointer-events-none transition-all"
            >
              <ChevronRight size={18} />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="hidden sm:block p-2 rounded-xl text-app-text-secondary hover:bg-app-bg hover:text-primary-500 disabled:opacity-20 disabled:pointer-events-none transition-all"
              title="Halaman Terakhir"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
