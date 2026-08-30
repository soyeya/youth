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

// SH 청년 주거 프로그램 — API 연동 불가 시 안내용 정적 데이터
const SH_PROGRAMS = [
  {
    id: 'sh-1',
    title: '청년안심주택 (역세권 청년주택)',
    desc: '서울시 역세권(지하철역 350m 이내) 지역에 공급되는 청년 전용 임대주택. 주변 시세 대비 저렴한 임대료로 제공됩니다.',
    type: '공공임대',
    url: 'https://www.i-sh.co.kr/',
  },
  {
    id: 'sh-2',
    title: '청년 매입임대주택',
    desc: 'SH가 기존 주택을 매입하여 시세 30~50% 수준의 임대료로 무주택 청년에게 공급하는 주택.',
    type: '매입임대',
    url: 'https://www.i-sh.co.kr/',
  },
  {
    id: 'sh-3',
    title: '청년 전세임대주택',
    desc: '청년이 원하는 주택을 직접 구해오면 SH가 전세계약을 체결하고 저렴하게 재임대해주는 제도.',
    type: '전세임대',
    url: 'https://www.i-sh.co.kr/',
  },
  {
    id: 'sh-4',
    title: '행복주택 (청년 특화)',
    desc: '대학생·청년·신혼부부를 위한 공공임대주택. 주변 시세 60~80% 수준의 임대료.',
    type: '행복주택',
    url: 'https://www.i-sh.co.kr/',
  },
];

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

const ShList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort = searchParams.get('sort') || 'latest';

  const [rawList, setRawList]         = useState(undefined); // undefined=로딩전, null=API없음
  const [sortType, setSortType]       = useState(initialSort);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { startLoading, finishLoading } = MyLayout.useLoading();
  const { upDateLogin, logout } = useLoginStatus();

  /* ── 데이터 로드 ── */
  const loadData = async () => {
    startLoading('SH 청년 임대 공고 불러오는 중...');
    try {
      const res = await axios.get(`${API_BASE}/shApi`);
      // null = API 없음 → 정적 안내 모드
      setRawList(Array.isArray(res.data) ? res.data : null);
    } catch (err) {
      console.log('SH 데이터 로드 오류:', err.message);
      setRawList(null);
    } finally {
      finishLoading();
    }
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);

  const hasLiveData = Array.isArray(rawList) && rawList.length > 0;

  /* ── 정렬 (라이브 데이터 있을 때만) ── */
  const sortedList = useMemo(() => {
    if (!hasLiveData) return [];
    const copy = [...rawList];
    if (sortType === 'latest') {
      copy.sort((a, b) => {
        const da = (a.PAN_DT || a.reg_dt || '').replace(/[^0-9]/g, '') || '0';
        const db = (b.PAN_DT || b.reg_dt || '').replace(/[^0-9]/g, '') || '0';
        return db.localeCompare(da);
      });
    } else {
      copy.sort((a, b) => {
        const da = (a.CLSG_DT || a.end_dt || '').replace(/[^0-9]/g, '') || '99999999';
        const db = (b.CLSG_DT || b.end_dt || '').replace(/[^0-9]/g, '') || '99999999';
        return da.localeCompare(db);
      });
    }
    return copy;
  }, [rawList, sortType, hasLiveData]);

  const filteredList = useMemo(() => {
    if (!hasLiveData) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedList;
    return sortedList.filter(
      (item) =>
        ((item.ttl || item.title || item.TITLE || '').toLowerCase().includes(q)) ||
        ((item.SIDO_NM || '').toLowerCase().includes(q))
    );
  }, [sortedList, searchQuery, hasLiveData]);

  useEffect(() => { setCurrentPage(1); }, [sortType, searchQuery, rawList]);

  const totalPages  = Math.ceil(filteredList.length / PAGE_SIZE);
  const sliceStart  = (currentPage - 1) * PAGE_SIZE;
  const pagedList   = filteredList.slice(sliceStart, sliceStart + PAGE_SIZE);

  const handleSortChange = (s) => {
    setSortType(s);
    setSearchParams({ sort: s });
  };

  const handleLogout = async () => {
    await logout(startLoading, finishLoading);
  };

  return (
    <Page
      header={<Title title={'SH 청년 임대주택'} backURL={'/'} />}
      footer={
        upDateLogin
          ? <Navi loginUpload color onClick={handleLogout} />
          : <Navi data={NaviDB.guestList} />
      }
    >
      <div className="sh-wrap">
        {/* 상단 배너 */}
        <div className="sh-banner">
          <span className="sh-badge">SH</span>
          <p>서울주택도시공사 청년 임대주택 공고</p>
          <span className="sh-sub">청년안심주택 · 매입임대 · 전세임대</span>
        </div>

        {/* ─ 라이브 데이터가 있을 때 ─ */}
        {hasLiveData && (
          <>
            <div className="search-bar sh-search">
              <input
                type="text"
                className="search-input"
                placeholder="공고명, 지역으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            <div className="lh-toolbar">
              <div className="board-sort-tabs">
                <button
                  className={sortType === 'latest' ? 'sort-tab active' : 'sort-tab'}
                  onClick={() => handleSortChange('latest')}
                >최신순</button>
                <button
                  className={sortType === 'deadline' ? 'sort-tab active' : 'sort-tab'}
                  onClick={() => handleSortChange('deadline')}
                >마감 임박순</button>
              </div>
              <span className="board-total">총 {filteredList.length}건</span>
            </div>

            <ul className="lh-list">
              {filteredList.length === 0 ? (
                <li className="lh-empty">
                  {searchQuery
                    ? `"${searchQuery}"에 해당하는 공고가 없습니다.`
                    : '현재 청년 대상 공고가 없습니다.'}
                </li>
              ) : (
                pagedList.map((item, i) => {
                  const title   = item.ttl || item.title || item.TITLE || '';
                  const dateEnd = item.CLSG_DT || item.end_dt || '';
                  const datePub = item.PAN_DT  || item.reg_dt || '';
                  const urgent  = isUrgent(dateEnd);
                  const expired = isExpired(dateEnd);

                  return (
                    <li
                      key={'sh' + (sliceStart + i)}
                      className={`lh-item${expired ? ' expired' : ''}`}
                      onClick={() =>
                        navigate(`/details/sh/${encodeURIComponent(item.PAN_ID || title)}`, {
                          state: { item },
                        })
                      }
                    >
                      <div className="lh-item-top">
                        <span className="sh-type-badge">SH</span>
                      </div>
                      <p className="lh-item-title">{title}</p>
                      <div className="lh-item-bottom">
                        {datePub && (
                          <span className="lh-region">공고일 {formatDate(datePub)}</span>
                        )}
                        {dateEnd && (
                          <span className={`lh-deadline${urgent ? ' urgent' : ''}${expired ? ' past' : ''}`}>
                            {expired ? '마감됨' : urgent ? `⚡ 마감 ${formatDate(dateEnd)}` : `마감 ${formatDate(dateEnd)}`}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        )}

        {/* ─ API 없을 때: 정적 프로그램 안내 카드 ─ */}
        {rawList === null && (
          <div className="sh-static">
            <p className="sh-static-notice">
              SH는 별도 공개 API가 없어 공식 사이트에서 확인하셔야 합니다.<br/>
              아래 청년 주거 프로그램에서 원하는 유형을 선택해 신청하세요.
            </p>
            <ul className="sh-programs">
              {SH_PROGRAMS.map((prog) => (
                <li key={prog.id} className="sh-program-card">
                  <div className="sh-program-top">
                    <span className="sh-prog-badge">{prog.type}</span>
                  </div>
                  <p className="sh-program-title">{prog.title}</p>
                  <p className="sh-program-desc">{prog.desc}</p>
                  <a
                    href={prog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sh-program-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    자세히 보기 →
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 공식 사이트 링크 */}
        <div className="lh-official">
          <a
            href="https://www.i-sh.co.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="sh-link-btn"
          >
            SH 공식 사이트 바로가기 →
          </a>
        </div>
      </div>
    </Page>
  );
};

export default ShList;
