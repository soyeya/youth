import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pagination from './Pagination';
import { formatDate } from '../utils/formatUtils';
import API_BASE from '../utils/apiConfig';

const PAGE_SIZE = 10;

const CATEGORIES = ['전체', '일자리', '복지', '주거', '교육', '금융', 'LH', 'SH'];

const CAT_COLOR = {
  '일자리': '#1565C0',
  '복지':   '#2E7D32',
  '주거':   '#6A1B9A',
  '교육':   '#E65100',
  '금융':   '#C62828',
  'LH':     '#003D7C',
  'SH':     '#1B5E20',
  '기타':   '#666',
};

/** section 문자열 + link 경로로 카테고리 판별 */
const parseCategory = (section, link) => {
  const raw = (section || '').trim();
  if (CATEGORIES.slice(1).includes(raw)) return raw;
  if (!link) return '기타';
  if (link.includes('/details/job/'))       return '일자리';
  if (link.includes('/details/welfare/'))   return '복지';
  if (link.includes('/details/residence/')) return '주거';
  if (link.includes('/details/education/')) return '교육';
  if (link.includes('/details/finance/'))   return '금융';
  if (link.includes('/details/lh/'))        return 'LH';
  if (link.includes('/details/sh/'))        return 'SH';
  return '기타';
};

/**
 * 금융 링크에서 상품유형 추출
 * 링크 형식: /details/finance/{productType}/{productName}
 */
const extractFinanceType = (link) => {
  if (!link) return null;
  const parts = link.split('/').filter(Boolean);
  // ['details', 'finance', '{type}', '{name}']
  if (parts.length >= 3 && parts[1] === 'finance') {
    return decodeURIComponent(parts[2]);
  }
  return null;
};

/** 공시시작일 → "YYYY.MM.DD 공시" 형태로 표기 (Finance 리스트 스타일) */
const formatFinanceDate = (dateStr) => {
  if (!dateStr) return null;
  const d = String(dateStr).replace(/[^0-9]/g, '');
  if (d.length !== 8) return null;
  return `${d.slice(0,4)}.${d.slice(4,6)}.${d.slice(6,8)} 공시`;
};

const toDate = (dl) => {
  if (!dl) return null;
  const d = String(dl).replace(/[^0-9]/g, '');
  if (d.length !== 8) return null;
  return new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`);
};
const isExpired = (dl) => { const d = toDate(dl); return d ? d < new Date() : false; };
const isUrgent  = (dl) => {
  const d = toDate(dl);
  if (!d) return false;
  const diff = (d - new Date()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
};

/**
 * WishlistPanel
 * Props:
 *  - userId  (string) — 로그인한 사용자 ID
 *  - compact (bool)   — true면 헤더를 작게 표시 (MyPage 임베드용)
 */
const WishlistPanel = ({ userId, compact = false }) => {
  const navigate = useNavigate();
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);

  const loadMyList = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res  = await axios.get(`${API_BASE}/MyList`, { params: { userId } });
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(
        data.map((it) => ({
          id:          it.id,
          title:       it.title,
          link:        it.link,
          section:     it.section,
          applyEnd:    it.applyEnd || null,
          banknm:      it.banknm   || null,
          category:    parseCategory(it.section, it.link),
          financeType: parseCategory(it.section, it.link) === '금융'
            ? extractFinanceType(it.link)
            : null,
        }))
      );
    } catch (err) {
      console.log('WishlistPanel 로드 오류:', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}"\n찜목록에서 삭제할까요?`)) return;
    try {
      await axios.delete(`${API_BASE}/MyList`, { data: { userId, title: item.title } });
      setItems((prev) => prev.filter((i) => i.title !== item.title));
    } catch {
      alert('삭제에 실패했습니다');
    }
  };

  const handleItemClick = (item) => {
    navigate(item.link, { state: { fromWishlist: true } });
  };

  const filtered = useMemo(() => {
    if (activeTab === '전체') return items;
    return items.filter((it) => it.category === activeTab);
  }, [items, activeTab]);

  const handleTabChange = (cat) => {
    setActiveTab(cat);
    setCurrentPage(1);
  };

  const countOf = (cat) => cat === '전체'
    ? items.length
    : items.filter((it) => it.category === cat).length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const sliceStart = (currentPage - 1) * PAGE_SIZE;
  const pagedItems = filtered.slice(sliceStart, sliceStart + PAGE_SIZE);

  /* ── 아이템 렌더링 헬퍼 ── */
  const renderDeadline = (item) => {
    /* 금융: applyEnd 없음 → 별도 처리 (공시 기반이라 마감 개념 다름) */
    if (item.category === '금융') {
      return (
        <span className="mylist-deadline fin-no-deadline">
          상품 유형: <strong>{item.financeType || '금융'}</strong>
        </span>
      );
    }

    /* 마감정보 없음 */
    if (!item.applyEnd) {
      return (
        <span className="mylist-deadline no-deadline">마감정보 없음</span>
      );
    }

    const expired = isExpired(item.applyEnd);
    const urgent  = isUrgent(item.applyEnd);
    return (
      <span className={
        `mylist-deadline${urgent ? ' urgent' : ''}${expired ? ' past' : ''}`
      }>
        {expired
          ? `마감 ${formatDate(item.applyEnd)}`
          : urgent
            ? `⚡ 마감 ${formatDate(item.applyEnd)}`
            : `마감 ${formatDate(item.applyEnd)}`}
      </span>
    );
  };

  /* ── 금융 아이템 전용 서브 정보 렌더 ── */
  const renderFinanceSub = (item) => (
    <div className="mylist-finance-sub">
      <div className="mylist-finance-meta">
        <em className="finance-type-badge">{item.financeType || '금융상품'}</em>
        {item.banknm && (
          <em className="finance-bank-badge">{item.banknm}</em>
        )}
      </div>
      <em className="finance-prdtnm">{item.title}</em>
    </div>
  );

  return (
    <div className={'wishlist-panel' + (compact ? ' compact' : '')}>
      {/* 아이디명 */}
      <p className={compact ? 'wishlist-panel-username compact' : 'mylist-username'}>
        {userId}님의 찜목록
      </p>

      {/* 카테고리 탭 */}
      <div className="mylist-tabs">
        {CATEGORIES.map((cat) => {
          const cnt = countOf(cat);
          if (cat !== '전체' && cnt === 0) return null;
          return (
            <button
              key={cat}
              className={`mylist-tab${activeTab === cat ? ' active' : ''}`}
              onClick={() => handleTabChange(cat)}
            >
              {cat}
              {cnt > 0 && <span className="mylist-tab-count">{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="mylist-empty">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="mylist-empty">
          {activeTab === '전체'
            ? '찜한 항목이 없습니다'
            : `${activeTab} 카테고리에 찜한 항목이 없습니다`}
        </div>
      ) : (
        <>
          <ul className="mylist-list">
            {pagedItems.map((item, i) => {
              const expired = item.applyEnd ? isExpired(item.applyEnd) : false;
              const color   = CAT_COLOR[item.category] || CAT_COLOR['기타'];
              const isFin   = item.category === '금융';

              return (
                <li
                  key={`wp-${i}`}
                  className={`mylist-item${expired ? ' expired' : ''}${isFin ? ' finance-item-wish' : ''}`}
                >
                  <div className="mylist-item-body" onClick={() => handleItemClick(item)}>
                    <div className="mylist-item-top">
                      <span className="mylist-cat-badge" style={{ background: color }}>
                        {item.category}
                      </span>
                      {expired && <span className="mylist-expired-badge">마감됨</span>}
                    </div>

                    {/* 금융: 상품유형 + 상품명 구분 표시 / 일반: 제목만 */}
                    {isFin ? (
                      renderFinanceSub(item)
                    ) : (
                      <p className="mylist-item-title">{item.title}</p>
                    )}

                    {/* 마감 정보 */}
                    {renderDeadline(item)}
                  </div>
                  <button
                    className="mylist-delete-btn"
                    title="찜 해제"
                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                  >✕</button>
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default WishlistPanel;
