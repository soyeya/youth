import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from './Pagination';
import { formatDate } from '../utils/formatUtils';

const PAGE_SIZE = 10;

const FinanceInfo = ({
  id, onChange, data, dataName, name,
  selectedType, sortType, onSortChange, isLoan, isPension,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // 검색 필터링 (은행명 + 상품명)
  const filteredData = useMemo(() => {
    if (!Array.isArray(dataName)) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return dataName;
    return dataName.filter(
      (v) =>
        (v.title && v.title.toLowerCase().includes(q)) ||
        (v.prdtnm && v.prdtnm.toLowerCase().includes(q))
    );
  }, [dataName, searchQuery]);

  const isList = filteredData.length > 0;
  const totalPages = isList ? Math.ceil(filteredData.length / PAGE_SIZE) : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [dataName, searchQuery]);

  // 상품 유형 변경 시 검색어 초기화
  useEffect(() => {
    setSearchQuery('');
  }, [selectedType]);

  const handleItemClick = (productName) => {
    if (name) {
      navigate(`${name}/${encodeURIComponent(productName)}`);
    }
  };

  const sliceStart = (currentPage - 1) * PAGE_SIZE;
  const pagedData = isList ? filteredData.slice(sliceStart, sliceStart + PAGE_SIZE) : [];

  // 금리순 버튼 레이블 (연금저축이면 숨김)
  const rateLabel = isLoan ? '낮은 금리순' : '높은 금리순';

  return (
    <div className="financeInfo">
      {/* 상품 유형 선택 드롭다운 */}
      <div className="formBox">
        <form id="myForm">
          <select
            form="myForm"
            id={id}
            onChange={onChange}
            name={id}
            value={selectedType || ''}
          >
            {data.map((v, i) => (
              <option key={id + i} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </form>
      </div>

      <div className="list">
        <div className="listBox">

          {/* 검색바 */}
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="은행명 또는 상품명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          {/* 툴바: 정렬 탭 + 총 건수 */}
          <div className="finance-toolbar">
            <div className="board-sort-tabs">
              <button
                className={sortType === 'latest' ? 'sort-tab active' : 'sort-tab'}
                onClick={() => onSortChange('latest')}
              >
                최신순
              </button>
              {/* 연금저축은 금리 데이터가 없으므로 금리순 탭 숨김 */}
              {!isPension && (
                <button
                  className={sortType === 'rate' ? 'sort-tab active' : 'sort-tab'}
                  onClick={() => onSortChange('rate')}
                >
                  {rateLabel}
                </button>
              )}
            </div>
            {Array.isArray(dataName) && dataName.length > 0 && (
              <span className="list_count">
                총 {filteredData.length}건
                {searchQuery && filteredData.length !== dataName.length
                  ? ` (전체 ${dataName.length}건 중)`
                  : ''}
              </span>
            )}
          </div>

          {/* 리스트 */}
          <ul>
            <li className="list_title">
              <p>금융상품 목록</p>
            </li>

            {isList ? (
              pagedData.map((v, i) => (
                <li
                  key={'list' + (sliceStart + i)}
                  onClick={() => handleItemClick(v.prdtnm)}
                  className="finance-item"
                >
                  <span className="finance-bank">{v.title}</span>
                  <span className="finance-prdtnm">{v.prdtnm}</span>
                  <span className="finance-sub">
                    {v.typenm && v.typenm !== '-' && <em>{v.typenm}</em>}
                    {v.rateDisplay && (
                      <em className={isLoan ? 'rate-loan' : 'rate-saving'}>
                        {v.rateDisplay}
                      </em>
                    )}
                    <em>{formatDate(v.start)}</em>
                  </span>
                </li>
              ))
            ) : (
              <li style={{ textAlign: 'center', padding: '20px', color: '#878787' }}>
                {searchQuery
                  ? `"${searchQuery}"에 해당하는 상품이 없습니다`
                  : Array.isArray(dataName) && dataName.length === 0
                  ? '검색결과가 없습니다'
                  : '금융상품을 불러오는 중...'}
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

export default FinanceInfo;
