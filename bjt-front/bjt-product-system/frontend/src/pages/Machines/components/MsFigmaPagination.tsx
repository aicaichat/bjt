import React, { useMemo } from 'react';

export interface MsFigmaPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: string[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  showTotal?: (total: number, range: [number, number]) => string;
  /** 「每页」说明文案 */
  perPageLabel?: string;
}

/** 列表底部分页：Figma 对齐用原生控件，减少对 Ant Pagination 的依赖 */
export const MsFigmaPagination: React.FC<MsFigmaPaginationProps> = ({
  current,
  pageSize,
  total,
  pageSizeOptions = ['10', '20', '50'],
  onPageChange,
  onPageSizeChange,
  showTotal,
  perPageLabel = 'Per page',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, current), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  const pageItems = useMemo(() => {
    const totalP = totalPages;
    if (totalP <= 9) {
      return Array.from({ length: totalP }, (_, i) => i + 1) as (number | 'ellipsis')[];
    }
    const set = new Set<number>();
    set.add(1);
    set.add(totalP);
    set.add(safePage);
    for (let d = 1; d <= 2; d++) {
      set.add(safePage - d);
      set.add(safePage + d);
    }
    const sorted = [...set].filter((n) => n >= 1 && n <= totalP).sort((a, b) => a - b);
    const out: (number | 'ellipsis')[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        out.push('ellipsis');
      }
      out.push(sorted[i]);
    }
    return out;
  }, [safePage, totalPages]);

  const summary =
    showTotal?.(total, [start, end]) ?? (total === 0 ? `0 / 0` : `${start}-${end} / ${total}`);

  return (
    <div className="ms-figma-pagination ms-figma-pagination--native" role="navigation" aria-label="Pagination">
      <span className="ms-figma-pagination__total">{summary}</span>
      <div className="ms-figma-pagination__controls">
        <button
          type="button"
          className="ms-figma-pagination__nav"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>
        <div className="ms-figma-pagination__pages">
          {pageItems.map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`e-${idx}`} className="ms-figma-pagination__ellipsis" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={
                  item === safePage
                    ? 'ms-figma-pagination__page ms-figma-pagination__page--active'
                    : 'ms-figma-pagination__page'
                }
                onClick={() => onPageChange(item)}
                aria-current={item === safePage ? 'page' : undefined}
              >
                {item}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          className="ms-figma-pagination__nav"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
      <label className="ms-figma-pagination__size">
        <span className="ms-figma-pagination__size-label">{perPageLabel}</span>
        <select
          value={String(pageSize)}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="ms-figma-pagination__select"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
