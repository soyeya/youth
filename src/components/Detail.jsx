import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatValue, formatDate } from '../utils/formatUtils';

/* ── 공통 섹션 컴포넌트 ── */
const Section = ({ title, children }) => (
  <div className="pol-section">
    <h4 className="pol-section-title">{title}</h4>
    <div className="pol-section-body">{children}</div>
  </div>
);

const InfoRow = ({ label, value, highlight }) => {
  const v = formatValue(value);
  if (v === '정보없음') return null; // 없는 조건은 표시 안 함
  return (
    <div className={`pol-info-row${highlight ? ' highlight' : ''}`}>
      <span className="pol-label">{label}</span>
      <span className="pol-value">{v}</span>
    </div>
  );
};

/* 마감일 긴급 판단 */
const getDdayInfo = (dateStr) => {
  if (!dateStr) return null;
  const d = String(dateStr).replace(/[^0-9]/g, '');
  if (d.length !== 8) return null;
  const end = new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`);
  const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

/* ── 메인 컴포넌트 ── */
const Detail = ({ policyData, onClick, isWishlisted }) => {
  const navigate = useNavigate();

  if (!policyData || !policyData.title) {
    return (
      <div className="detail pol-detail">
        <button className="back-btn" onClick={() => navigate(-1)}>← 목록으로</button>
        <div className="pol-empty">정책 정보를 불러오는 중입니다...</div>
      </div>
    );
  }

  const p = policyData;
  const dday = getDdayInfo(p.applyEnd);
  const hasApplyPeriod = p.applyStart || p.applyEnd;
  const hasBizPeriod   = p.bizStart   || p.bizEnd;
  const hasQualification =
    formatValue(p.ageInfo) !== '정보없음' ||
    formatValue(p.empStatus) !== '정보없음' ||
    formatValue(p.eduLevel) !== '정보없음' ||
    formatValue(p.marryStatus) !== '정보없음';

  const safeUrl = (url) => url && url.trim() && url.trim() !== '-';

  return (
    <div className="detail pol-detail">
      <button className="back-btn" onClick={() => navigate(-1)}>← 목록으로</button>

      {/* 헤더 */}
      <div className="pol-header">
        {p.category && <span className="pol-badge">{p.category}</span>}
        {p.administration && (
          <span className="pol-org">{p.administration}</span>
        )}
      </div>
      <h3 className="pol-title">{p.title}</h3>

      {/* 마감 임박 하이라이트 */}
      {dday !== null && dday >= 0 && dday <= 7 && (
        <div className="pol-urgent">
          ⚡ 신청 마감까지 <strong>{dday === 0 ? '오늘까지' : `${dday}일`}</strong> 남았습니다!
        </div>
      )}
      {dday !== null && dday < 0 && (
        <div className="pol-expired">이 정책의 신청 기간이 종료되었습니다.</div>
      )}

      {/* 정책 소개 */}
      {formatValue(p.info) !== '정보없음' && (
        <Section title="정책 소개">
          <p className="pol-long-text">{p.info}</p>
        </Section>
      )}

      {/* 지원 내용 */}
      {formatValue(p.etct) !== '정보없음' && (
        <Section title="지원 내용">
          <p className="pol-long-text">{p.etct}</p>
        </Section>
      )}

      {/* 지원 자격 — 사용자가 가장 먼저 확인해야 할 핵심 정보 */}
      {hasQualification && (
        <Section title="지원 자격">
          <InfoRow label="나이 조건"   value={p.ageInfo} />
          <InfoRow label="취업 상태"   value={p.empStatus} />
          <InfoRow label="학력 조건"   value={p.eduLevel} />
          <InfoRow label="결혼 상태"   value={p.marryStatus} />
        </Section>
      )}

      {/* 신청 기간 */}
      {hasApplyPeriod && (
        <Section title="신청 기간">
          <div className="pol-period-row">
            <span>{formatDate(p.applyStart) || '정보없음'}</span>
            <span className="pol-period-sep">~</span>
            <span className={dday !== null && dday <= 7 && dday >= 0 ? 'pol-date-urgent' : ''}>
              {formatDate(p.applyEnd) || '정보없음'}
            </span>
          </div>
        </Section>
      )}

      {/* 사업 기간 */}
      {hasBizPeriod && (
        <Section title="사업 기간">
          <div className="pol-period-row">
            <span>{formatDate(p.bizStart) || '정보없음'}</span>
            <span className="pol-period-sep">~</span>
            <span>{formatDate(p.bizEnd) || '정보없음'}</span>
          </div>
        </Section>
      )}

      {/* 신청 방법 */}
      {formatValue(p.applyMethod) !== '정보없음' && (
        <Section title="신청 방법">
          <p className="pol-long-text">{p.applyMethod}</p>
        </Section>
      )}

      {/* 운영 기관 */}
      {(formatValue(p.administration) !== '정보없음' || formatValue(p.operInst) !== '정보없음') && (
        <Section title="담당 기관">
          <InfoRow label="주관 기관" value={p.administration} />
          <InfoRow label="운영 기관" value={p.operInst} />
        </Section>
      )}

      {/* 신청 링크 */}
      {(safeUrl(p.address) || safeUrl(p.refUrl1) || safeUrl(p.refUrl2)) && (
        <Section title="신청 및 참고">
          {safeUrl(p.address) && (
            <a href={p.address} target="_blank" rel="noopener noreferrer" className="pol-link primary">
              신청 바로가기 →
            </a>
          )}
          {safeUrl(p.refUrl1) && (
            <a href={p.refUrl1} target="_blank" rel="noopener noreferrer" className="pol-link">
              참고 자료 1
            </a>
          )}
          {safeUrl(p.refUrl2) && (
            <a href={p.refUrl2} target="_blank" rel="noopener noreferrer" className="pol-link">
              참고 자료 2
            </a>
          )}
        </Section>
      )}

      {/* 찜하기 */}
      <div
        className={`pol-wishlist${isWishlisted ? ' active' : ''}`}
        onClick={onClick}
      >
        {isWishlisted ? '♥ 찜 해제하기' : '♡ 찜하기'}
      </div>
    </div>
  );
};

export default Detail;
