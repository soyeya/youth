import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Page from '../../components/Page.jsx';
import Title from '../../components/Title.jsx';
import Navi from '../../components/Navi.jsx';
import naviDB from '../../json/navi.json';
import ExpiredNotice from '../../components/ExpiredNotice';
import { formatDate } from '../../utils/formatUtils';
import useLoginStatus from '../../utils/useLoginStatus';
import useWishlist from '../../utils/useWishlist';

const getDdayInfo = (dateStr) => {
  if (!dateStr) return null;
  const d = String(dateStr).replace(/[^0-9]/g, '');
  if (d.length !== 8) return null;
  return Math.ceil(
    (new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`) - new Date()) /
    (1000 * 60 * 60 * 24)
  );
};

const ShDetail = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { upDateLogin, dataContent, logout } = useLoginStatus();
  const handleLogout = async () => { await logout(); };

  const item = location.state?.item || null;
  const fromWishlist = !!location.state?.fromWishlist;

  const title   = item ? (item.ttl || item.title || item.TITLE || item.PAN_NM || '공고') : '';
  const dateEnd = item ? (item.CLSG_DT || item.end_dt || '') : '';
  const datePub = item ? (item.PAN_DT  || item.reg_dt || '') : '';
  const dday    = getDdayInfo(dateEnd);

  // 찜하기 — PAN_ID 또는 title로 link 구성
  const itemId  = item?.PAN_ID || title;
  const wLink   = `/details/sh/${encodeURIComponent(itemId)}`;
  const { isWishlisted, toggleWishlist } = useWishlist({
    userId:   upDateLogin ? dataContent?.[0] : null,
    section:  'SH',
    link:     wLink,
    title,
    applyEnd: dateEnd,
  });
  const doToggle = async () => {
    const { msg } = await toggleWishlist();
    if (msg) alert(msg);
  };

  if (!item) {
    return (
      <Page
        header={<Title title={'SH 공고 상세'} />}
        footer={upDateLogin ? <Navi loginDetail onClick={handleLogout} /> : <Navi data={naviDB.guestList} />}
      >
        <div className="detail pol-detail">
          <button className="back-btn" onClick={() => navigate(-1)}>← 목록으로</button>
          <div className="pol-empty">공고 정보를 찾을 수 없습니다.</div>
        </div>
      </Page>
    );
  }

  /* 찜목록에서 진입 + 공고 마감 */
  if (fromWishlist && dday !== null && dday < 0) {
    return (
      <Page
        header={<Title title={'SH 공고 상세'} />}
        footer={upDateLogin ? <Navi loginDetail onClick={handleLogout} /> : <Navi data={naviDB.guestList} />}
      >
        <ExpiredNotice
          itemTitle={title}
          label="공고"
          onRemove={isWishlisted ? doToggle : undefined}
        />
      </Page>
    );
  }

  return (
    <Page
      header={<Title title={'SH 공고 상세'} />}
      footer={upDateLogin ? <Navi loginDetail onClick={handleLogout} /> : <Navi data={naviDB.guestList} />}
    >
      <div className="detail pol-detail">
        <button className="back-btn" onClick={() => navigate(-1)}>← 목록으로</button>

        {/* 헤더 */}
        <div className="pol-header">
          <span className="pol-badge" style={{ background: '#1B5E20', color: '#fff' }}>
            SH
          </span>
        </div>
        <h3 className="pol-title">{title}</h3>

        {/* D-day */}
        {dday !== null && dday >= 0 && dday <= 7 && (
          <div className="pol-urgent">
            ⚡ 마감까지 <strong>{dday === 0 ? '오늘까지' : `${dday}일`}</strong> 남았습니다!
          </div>
        )}
        {dday !== null && dday < 0 && (
          <div className="pol-expired">이 공고의 모집 기간이 종료되었습니다.</div>
        )}

        {/* 공고 기간 */}
        {(datePub || dateEnd) && (
          <div className="pol-section">
            <h4 className="pol-section-title">공고 기간</h4>
            <div className="pol-section-body">
              <div className="pol-period-row">
                <span>{datePub ? formatDate(datePub) : '정보없음'}</span>
                <span className="pol-period-sep">~</span>
                <span className={dday !== null && dday >= 0 && dday <= 7 ? 'pol-date-urgent' : ''}>
                  {dateEnd ? formatDate(dateEnd) : '정보없음'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 신청 안내 */}
        <div className="pol-section">
          <h4 className="pol-section-title">신청 안내</h4>
          <div className="pol-section-body">
            <p className="pol-long-text lh-apply-notice">
              SH 공식 사이트에서 자세한 공고 내용과 청약 일정을 확인하고 신청하세요.
            </p>
            <a
              href="https://www.i-sh.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="pol-link primary"
            >
              SH 공식 사이트에서 확인하기 →
            </a>
          </div>
        </div>

        {/* 찜하기 */}
        <div
          className={`pol-wishlist${isWishlisted ? ' active' : ''}`}
          onClick={doToggle}
        >
          {isWishlisted ? '♥ 찜 해제하기' : '♡ 찜하기'}
        </div>
      </div>
    </Page>
  );
};

export default ShDetail;
