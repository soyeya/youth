import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from './Pagination';
import { formatDate } from '../utils/formatUtils';

const PAGE_SIZE = 10;

/**
 * Info 컴포넌트
 * props:
 *   id           - 카테고리명 (일자리 / 주거 / 복지 / 교육)
 *   name         - 상세 링크 prefix (/details/job 등)
 *   items        - [{ title, desc, applyEnd, bizStart }, ...]
 *   sortType     - 'latest' | 'deadline'
 *   onSortChange - (type) => void
 */
const Info = ({ id, name, items, sortType = 'latest', onSortChange }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.desc && item.desc.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const hasData = filteredItems.length > 0;
  const totalPages = hasData ? Math.ceil(filteredItems.length / PAGE_SIZE) : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [items, sortType, searchQuery]);

  const handleClick = (title) => {
    if (name && title) navigate(`${name}/${encodeURIComponent(title)}`);
  };

  const sliceStart = (currentPage - 1) * PAGE_SIZE;
  const pagedItems = hasData ? filteredItems.slice(sliceStart, sliceStart + PAGE_SIZE) : [];

  // 마감 임박 판단 (7일 이내)
  const isUrgent = (dateStr) => {
    if (!dateStr) return false;
    const d = dateStr.replace(/[^0-9]/g, '');
    if (d.length !== 8) return false;
    const end = new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`);
    const diff = (end - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };
  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const d = dateStr.replace(/[^0-9]/g, '');
    if (d.length !== 8) return false;
    return new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`) < new Date();
  };

  return (
    <div className="info">
      {/* 검색바 */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder={`${id} 정책 검색...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      <div className="list">
        <div className="listBox">
          {/* 툴바: 정렬 탭 + 총 건수 */}
          <div className="finance-toolbar">
            <div className="board-sort-tabs">
              <button
                className={sortType === 'latest' ? 'sort-tab active' : 'sort-tab'}
                onClick={() => onSortChange && onSortChange('latest')}
              >
                최신순
              </button>
              <button
                className={sortType === 'deadline' ? 'sort-tab active' : 'sort-tab'}
                onClick={() => onSortChange && onSortChange('deadline')}
              >
                마감 임박순
              </button>
            </div>
            <span className="list_count">
              총 {filteredItems.length}건
              {searchQuery && Array.isArray(items) && filteredItems.length !== items.length
                ? ` (전체 ${items.length}건 중)`
                : ''}
            </span>
          </div>

          <ul>
            <li className="list_title">
              <p>{id} 정책</p>
            </li>

            {hasData ? (
              pagedItems.map((item, i) => {
                const urgent = isUrgent(item.applyEnd);
                const expired = isExpired(item.applyEnd);
                return (
                  <li
                    key={'list' + (sliceStart + i)}
                    className={`policy-item${expired ? ' expired' : ''}`}
                    onClick={() => handleClick(item.title)}
                  >
                    <span className="policy-title">{item.title}</span>
                    {item.desc && <p className="policy-desc">{item.desc}</p>}
                    {item.applyEnd && (
                      <span className={`policy-deadline${urgent ? ' urgent' : ''}${expired ? ' past' : ''}`}>
                        {expired
                          ? '마감됨'
                          : urgent
                          ? `⚡ 마감 ${formatDate(item.applyEnd)}`
                          : `신청 마감 ${formatDate(item.applyEnd)}`}
                      </span>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="policy-empty">
                {searchQuery
                  ? `"${searchQuery}"에 해당하는 정책이 없습니다`
                  : '해당 카테고리의 정책이 없습니다'}
              </li>
            )}
          </ul>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>
    </div>
  );
};

export default Info;
