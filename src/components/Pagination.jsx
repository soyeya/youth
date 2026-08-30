import React from 'react';

/**
 * Pagination 컴포넌트
 * props:
 *   currentPage  - 현재 페이지 (1-based)
 *   totalPages   - 전체 페이지 수
 *   onPageChange - 페이지 변경 콜백 (page: number) => void
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const MAX_VISIBLE = 5;
  let start = Math.max(1, currentPage - Math.floor(MAX_VISIBLE / 2));
  let end = Math.min(totalPages, start + MAX_VISIBLE - 1);
  if (end - start < MAX_VISIBLE - 1) {
    start = Math.max(1, end - MAX_VISIBLE + 1);
  }

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      {/* 이전 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {/* 첫 페이지 + 줄임표 */}
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <span className="ellipsis">…</span>}
        </>
      )}

      {/* 페이지 번호들 */}
      {pages.map((p) => (
        <button
          key={p}
          className={p === currentPage ? 'active' : ''}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {/* 마지막 페이지 + 줄임표 */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="ellipsis">…</span>}
          <button onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      {/* 다음 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;
