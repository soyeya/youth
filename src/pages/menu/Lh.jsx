import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page';
import Title from '../../components/Title';
import Navi from '../../components/Navi';
import NaviDB from '../../json/navi.json';
import Pagination from '../../components/Pagination';
import * as MyLayout from '../../lib/MyLayout';
import API_BASE from '../../utils/apiConfig';
import { formatDate } from '../../utils/formatUtils';
import useLoginStatus from '../../utils/useLoginStatus';

const PAGE_SIZE = 10;

const isUrgent = (dateStr) => {
  if (!dateStr) return false;
  const d = String(dateStr).replace(/[^0-9]/g, '');
  if (d.length !== 8) return false;
  const end = new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`);
  const diff = (end - new Date()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
};

const isExpired = (dateStr) => {
  if (!dateStr) return false;
  const d = String(dateStr).replace(/[^0-9]/g, '');
  if (d.length !== 8) return false;
  return new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`) < new Date();
};

const YOUTH_TYPE_ORDER = ['행복주택', '매입임대', '전세임대', '국민임대', '영구임대'];

const LhList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL searchParams에서 초기값 읽기 (뒤로가기 시 상태 복원)
  const initialSort   = searchParams.get('sort')   || 'latest';
  const initialType   = searchParams.get('type')   || '전체';
  const initialRegion = searchParams.get('region') || '전체';

  const [rawList, setRawList]           = useState(null);
  const [sortType, setSortType]         = useState(initialSort);
  const [searchQuery, setSearchQuery]   = useState('');
  const [typeFilter, setTypeFilter]     = useState(initialType);
  const [regionFilter, setRegionFilter] = useState(initialRegion);
  const [currentPage, setCurrentPage]   = useState(1);

  const { startLoading, finishLoading } = MyLayout.useLoading();
  const { upDateLogin, logout }         = useLoginStatus();

  const loadData = async () => {
    startLoading('LH 공고 불러오는 중...');
    try {
      const res = await axios.get(`${API_BASE}/lhApi`);
      setRawList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log('LH 데이터 로드 오류:', err.message);
      setRawList([]);
    } finally {
      finishLoading();
    }
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);

  // URL params 동기화 헬퍼
  const updateParam = (key, val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set(key, val);
      return next;
    });
  };

  const handleSortChange = (s) => {
    setSortType(s);
    updateParam('sort', s);
  };
  const handleTypeChange = (v) => {
    setTypeFilter(v);
    updateParam('type', v);
  };
  const handleRegionChange = (v) => {
    setRegionFilter(v);
    updateParam('region', v);
  };

  /* ── 셀렉박스 옵션 동적 추출 ── */
  const typeOptions = useMemo(() => {
    if (!Array.isArray(rawList) || rawList.length === 0) return ['전체'];
    const set = new Set(rawList.map(item => item.AIS_TP_NM || item.AIS_TP_CD_NM || '').filter(Boolean));
    const types = [...set];
    const youth  = YOUTH_TYPE_ORDER.filter(t => types.includes(t));
    const others = types.filter(t => !YOUTH_TYPE_ORDER.includes(t)).sort();
    return ['전체', ...youth, ...others];
  }, [rawList]);

  const regionOptions = useMemo(() => {
    if (!Array.isArray(rawList) || rawList.length === 0) return ['전체'];
    const set = new Set(rawList.map(item => item.SIDO_NM || item.CNP_CD_NM || '').filter(Boolean));
    return ['전체', ...[...set].sort()];
  }, [rawList]);

  /* ── 정렬 ── */
  const sortedList = useMemo(() => {
    if (!Array.isArray(rawList) || rawList.length === 0) return rawList || [];
    const copy = [...rawList];
    if (sortType === 'latest') {
      copy.sort((a, b) => {
        const da = String(a.PAN_DT || a.PAN_NT_ST_DT || '').replace(/[^0-9]/g, '') || '0';
        const db = String(b.PAN_DT || b.PAN_NT_ST_DT || '').replace(/[^0-9]/g, '') || '0';
        return db.localeCompare(da);
      });
    } else {
      copy.sort((a, b) => {
        const da = String(a.CLSG_DT || '').replace(/[^0-9]/g, '') || '99999999';
        const db = String(b.CLSG_DT || '').replace(/[^0-9]/g, '') || '99999999';
        return da.localeCompare(db);
      });
    }
    return copy;
  }, [rawList, sortType]);

  /* ── 유형 + 지역 + 검색 필터 ── */
  const filteredList = useMemo(() => {
    let list = sortedList;
    if (typeFilter !== '전체') {
      list = list.filter(item => (item.AIS_TP_NM || item.AIS_TP_CD_NM || '') === typeFilter);
    }
    if (regionFilter !== '전체') {
      list = list.filter(item => (item.SIDO_NM || item.CNP_CD_NM || '') === regionFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(item =>
        (item.PAN_NM       && item.PAN_NM.toLowerCase().includes(q)) ||
        (item.SIDO_NM      && item.SIDO_NM.toLowerCase().includes(q)) ||
        (item.CNP_CD_NM    && item.CNP_CD_NM.toLowerCase().includes(q)) ||
        (item.AIS_TP_NM    && item.AIS_TP_NM.toLowerCase().includes(q)) ||
        (item.AIS_TP_CD_NM && item.AIS_TP_CD_NM.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sortedList, typeFilter, regionFilter, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [typeFilter, regionFilter, sortType, searchQuery, rawList]);

  const totalPages = Math.ceil(filteredList.length / PAGE_SIZE);
  const sliceStart = (currentPage - 1) * PAGE_SIZE;
  const pagedList  = filteredList.slice(sliceStart, sliceStart + PAGE_SIZE);

  const handleLogout = async () => { await logout(startLoading, finishLoading); };
  const isNoKey = rawList !== null && rawList.length === 0;

  return (
    <Page
      header={<Title title={'LH 임대주택 공고'} backURL={'/'} />}
      footer={upDateLogin ? <Navi loginUpload color onClick={handleLogout} /> : <Navi data={NaviDB.guestList} />}
    >
      <div className="lh-wrap">
        <div className="lh-banner">
          <span className="lh-badge">LH</span>
          <p>한국토지주택공사 임대주택 공고</p>
          <span className="lh-sub">행복주택 · 매입임대 · 전세임대 · 국민임대</span>
        </div>

        {rawList === null ? null : isNoKey ? (
          <div className="lh-nokey">
            <div className="lh-nokey-icon">🔑</div>
            <p className="lh-nokey-title">LH API 키를 설정해 주세요</p>
            <p className="lh-nokey-desc">
              공공데이터포털에서 <strong>한국토지주택공사_분양임대공고문조회서비스</strong>를
              신청한 뒤, 발급된 키를 서버의 <code>.env</code>에
              <code>LH_API_KEY=발급키</code> 형태로 추가하세요.
            </p>
          </div>
        ) : (
          <>
            {/* ── 필터 바 ── */}
            <div className="lh-filter-bar">
              <div className="lh-filter-group">
                <label className="lh-filter-label">유형</label>
                <select className="lh-select" value={typeFilter} onChange={e => handleTypeChange(e.target.value)}>
                  {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="lh-filter-group">
                <label className="lh-filter-label">지역</label>
                <select className="lh-select" value={regionFilter} onChange={e => handleRegionChange(e.target.value)}>
                  {regionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* 검색바 */}
            <div className="search-bar lh-search">
              <input
                type="text"
                className="search-input"
                placeholder="공고명, 지역, 유형으로 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>}
            </div>

            {/* 툴바 */}
            <div className="lh-toolbar">
              <div className="board-sort-tabs">
                <button className={sortType === 'latest' ? 'sort-tab active' : 'sort-tab'} onClick={() => handleSortChange('latest')}>최신순</button>
                <button className={sortType === 'deadline' ? 'sort-tab active' : 'sort-tab'} onClick={() => handleSortChange('deadline')}>마감 임박순</button>
              </div>
              <span className="board-total">
                총 {filteredList.length}건
                {(typeFilter !== '전체' || regionFilter !== '전체' || searchQuery) && filteredList.length !== sortedList.length
                  ? ` (전체 ${sortedList.length}건 중)` : ''}
              </span>
            </div>

            {/* 목록 */}
            <ul className="lh-list">
              {filteredList.length === 0 ? (
                <li className="lh-empty">해당하는 공고가 없습니다.</li>
              ) : pagedList.map((item, i) => {
                const urgent     = isUrgent(item.CLSG_DT);
                const expired    = isExpired(item.CLSG_DT);
                const typeName   = item.AIS_TP_NM || item.AIS_TP_CD_NM || '임대';
                const isYouth    = YOUTH_TYPE_ORDER.includes(typeName);
                const regionName = item.SIDO_NM || item.CNP_CD_NM || '';

                return (
                  <li
                    key={'lh' + (sliceStart + i)}
                    className={`lh-item${expired ? ' expired' : ''}`}
                    onClick={() => navigate(`/details/lh/${encodeURIComponent(item.PAN_ID)}`, { state: { item } })}
                  >
                    <div className="lh-item-top">
                      <span className={`lh-type-badge${isYouth ? ' youth' : ''}`}>{typeName}</span>
                      {regionName && <span className="lh-region">{regionName}</span>}
                      {item.PAN_SS && (
                        <span className={`lh-status-badge${item.PAN_SS.includes('공고') ? ' active' : ''}`}>
                          {item.PAN_SS}
                        </span>
                      )}
                    </div>
                    <p className="lh-item-title">{item.PAN_NM || '공고명 없음'}</p>
                    <div className="lh-item-bottom">
                      {item.CLSG_DT ? (
                        <span className={`lh-deadline${urgent ? ' urgent' : ''}${expired ? ' past' : ''}`}>
                          {expired ? '마감됨' : urgent ? `마감 ${formatDate(item.CLSG_DT)}` : `마감 ${formatDate(item.CLSG_DT)}`}
                        </span>
                      ) : item.PAN_DT ? (
                        <span className="lh-post-date">게시 {formatDate(item.PAN_DT)}</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={p => setCurrentPage(p)} />
          </>
        )}

        <div className="lh-official">
          <a href="https://apply.lh.or.kr" target="_blank" rel="noopener noreferrer" className="lh-link-btn outline">
            LH 청약센터 바로가기 →
          </a>
        </div>
      </div>
    </Page>
  );
};

export default LhList;
