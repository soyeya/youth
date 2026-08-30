import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/formatUtils';

const PAGE_SIZE = 10;

/**
 * Board 컴포넌트
 * - 최신순: 사업 시작일(startDate) 내림차순 (최근 시작 정책 먼저)
 * - 인기순: 사업 종료일(endDate) 오름차순 (마감 임박 정책 먼저 — 놓치지 말아야 할 정책)
 */
const Board = ({ boardList }) => {
  const [sortType, setSortType] = useState('latest'); // 'latest' | 'popular'
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // 정렬 / 검색 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [sortType, boardList, searchQuery]);

  // 정렬된 목록 (메모이제이션)
  const sortedList = useMemo(() => {
    if (!Array.isArray(boardList) || boardList.length === 0) return [];

    const copy = [...boardList];

    if (sortType === 'latest') {
      copy.sort((a, b) => {
        const da = a.startDate ? a.startDate.replace(/[^0-9]/g, '') : '0';
        const db = b.startDate ? b.startDate.replace(/[^0-9]/g, '') : '0';
        return db.localeCompare(da);
      });
    } else {
      copy.sort((a, b) => {
        const da = a.endDate ? a.endDate.replace(/[^0-9]/g, '') : '99999999';
        const db = b.endDate ? b.endDate.replace(/[^0-9]/g, '') : '99999999';
        return da.localeCompare(db);
      });
    }

    return copy;
  }, [boardList, sortType]);

  // 검색 필터링
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedList;
    return sortedList.filter(
      (v) =>
        (v.title && v.title.toLowerCase().includes(q)) ||
        (v.administration && v.administration.toLowerCase().includes(q))
    );
  }, [sortedList, searchQuery]);

  const totalPages = Math.ceil(filteredList.length / PAGE_SIZE);
  const sliceStart = (currentPage - 1) * PAGE_SIZE;
  const pagedList = filteredList.slice(sliceStart, sliceStart + PAGE_SIZE);

  const isEmpty = !boardList || boardList.length === 0;

  return (
    <div className="board">
      {/* 헤더 */}
      <h3>
        <span>News</span>다양한 유스에게의 소식을 확인하세요
      </h3>

      {/* 검색바 */}
      <div className="search-bar board-search">
        <input
          type="text"
          className="search-input"
          placeholder="정책 뉴스 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* 정렬 탭 + 총 건수 */}
      <div className="board-toolbar">
        <div className="board-sort-tabs">
          <button
            className={sortType === 'latest' ? 'sort-tab active' : 'sort-tab'}
            onClick={() => setSortType('latest')}
          >
            최신순
          </button>
          <button
            className={sortType === 'popular' ? 'sort-tab active' : 'sort-tab'}
            onClick={() => setSortType('popular')}
          >
            인기순
          </button>
        </div>
        {!isEmpty && (
          <span className="board-total">
            총 {filteredList.length}건
            {searchQuery && filteredList.length !== sortedList.length
              ? ` (전체 ${sortedList.length}건 중)`
              : ''}
          </span>
        )}
      </div>

      {/* 목록 */}
      <ul>
        {isEmpty ? (
          <li className="board-empty">불러올 정책 소식이 없습니다.</li>
        ) : filteredList.length === 0 ? (
          <li className="board-empty">"{searchQuery}"에 해당하는 소식이 없습니다.</li>
        ) : (
          pagedList.map((v, i) => (
            <li key={'board' + (sliceStart + i)}>
              <Link to={`/details/job/${encodeURIComponent(v.title)}`}>
                <p>{v.title}</p>
                <span className="board-meta">
                  <em>{v.administration || ''}</em>
                  {v.endDate && (
                    <em className="board-date">마감 {formatDate(v.endDate)}</em>
                  )}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>

      {/* 페이지네이션 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
      />
    </div>
  );
};

export default Board;
