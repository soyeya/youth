import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ExpiredNotice from '../../components/ExpiredNotice';
import useWishlist from '../../utils/useWishlist';
import axios from 'axios';
import Page from '../../components/Page.jsx';
import Title from '../../components/Title.jsx';
import Navi from '../../components/Navi.jsx';
import naviDB from '../../json/navi.json';
import * as MyLayout from '../../lib/MyLayout.jsx';
import API_BASE from '../../utils/apiConfig';
import { formatDate } from '../../utils/formatUtils';
import useLoginStatus from '../../utils/useLoginStatus';

const TYPE_INFO = {
  '07': { label: '행복주택',  color: '#1565C0' },
  '09': { label: '매입임대',  color: '#2E7D32' },
  '17': { label: '전세임대',  color: '#6A1B9A' },
};
const YOUTH_TYPES = ['행복주택', '매입임대', '전세임대', '국민임대', '영구임대'];

const getDdayInfo = (dateStr) => {
  if (!dateStr) return null;
  const d = String(dateStr).replace(/[^0-9]/g, '');
  if (d.length !== 8) return null;
  const end = new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`);
  return Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
};

// 파일 확장자 아이콘
const fileIcon = (filename) => {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'pdf')  return '📄';
  if (ext === 'hwp' || ext === 'hwpx') return '📝';
  if (['xls','xlsx'].includes(ext)) return '📊';
  if (['jpg','jpeg','png','gif'].includes(ext)) return '🖼️';
  return '📎';
};

// 날짜 범위 표시
const dateRange = (start, end) => {
  if (!start && !end) return '-';
  if (!start) return `~ ${formatDate(end)}`;
  if (!end)   return `${formatDate(start)} ~`;
  return `${formatDate(start)} ~ ${formatDate(end)}`;
};

const LhDetail = () => {
  const { panId }  = useParams();
  const location   = useLocation();
  const navigate   = useNavigate();

  const [item, setItem]       = useState(location.state?.item || null);
  const [detail, setDetail]   = useState(null);   // API 상세 응답
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState(false);
  const [loading, setLoading] = useState(!location.state?.item);

  const { startLoading, finishLoading } = MyLayout.useLoading();
  const { upDateLogin, dataContent, logout } = useLoginStatus();
  const handleLogout = async () => { await logout(startLoading, finishLoading); };
  const fromWishlist = !!location.state?.fromWishlist;

  // 찜하기 — item이 로드된 뒤 link/title/applyEnd가 확정됨
  const panIdStr  = item?.PAN_ID  ? encodeURIComponent(item.PAN_ID) : decodeURIComponent(panId);
  const wLink     = `/details/lh/${panIdStr}`;
  const wTitle    = item?.PAN_NM || '';
  const wApplyEnd = item?.CLSG_DT || '';
  const { isWishlisted, toggleWishlist } = useWishlist({
    userId:   upDateLogin ? dataContent?.[0] : null,
    section:  'LH',
    link:     wLink,
    title:    wTitle,
    applyEnd: wApplyEnd,
  });
  const doToggle = async () => {
    const { msg } = await toggleWishlist();
    if (msg) alert(msg);
  };

  /* ── 목록 아이템 로드 (state 없을 때) ── */
  useEffect(() => {
    if (item) return;
    const load = async () => {
      startLoading('공고 정보 불러오는 중...');
      try {
        const res = await axios.get(`${API_BASE}/lhApi`);
        const list = Array.isArray(res.data) ? res.data : [];
        const decoded = decodeURIComponent(panId);
        setItem(list.find(i => String(i.PAN_ID) === decoded) || null);
      } catch (err) {
        setItem(null);
      } finally {
        finishLoading();
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line
  }, [panId]);

  /* ── 상세정보 API 호출 ── */
  useEffect(() => {
    if (!item?.PAN_ID) return;
    const fetchDetail = async () => {
      setDetailLoading(true);
      setDetailError(false);
      try {
        const params = new URLSearchParams({ panId: item.PAN_ID });
        if (item.SPL_INF_TP_CD)      params.set('splInfTpCd',      item.SPL_INF_TP_CD);
        if (item.CCR_CNNT_SYS_DS_CD) params.set('ccrCnntSysDsCd',  item.CCR_CNNT_SYS_DS_CD);
        if (item.UPP_AIS_TP_CD)      params.set('uppAisTpCd',       item.UPP_AIS_TP_CD);
        if (item.AIS_TP_CD)          params.set('aisTpCd',           item.AIS_TP_CD);

        const res = await axios.get(`${API_BASE}/lhDetailApi?${params.toString()}`);
        setDetail(res.data && Object.keys(res.data).length > 1 ? res.data : null);
      } catch (err) {
        console.log('LhDetail 상세 API 오류:', err.message);
        setDetailError(true);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [item]);



  if (loading) {
    return (
      <Page header={<Title title={'LH 공고 상세'} />} footer={<Navi data={naviDB.guestList} />}>
        <div className="detail pol-detail">
          <button className="back-btn" onClick={() => navigate(-1)}>← 목록으로</button>
          <div className="pol-empty">공고 정보를 불러오는 중입니다...</div>
        </div>
      </Page>
    );
  }

  if (!item) {
    return (
      <Page header={<Title title={'LH 공고 상세'} />} footer={<Navi data={naviDB.guestList} />}>
        <div className="detail pol-detail">
          <button className="back-btn" onClick={() => navigate(-1)}>← 목록으로</button>
          <div className="pol-empty">공고 정보를 찾을 수 없습니다.</div>
        </div>
      </Page>
    );
  }

  /* 찜목록에서 진입 + 공고 마감 시 ExpiredNotice 표시 */
  const clsgDday = getDdayInfo(item.CLSG_DT);
  if (fromWishlist && clsgDday !== null && clsgDday < 0) {
    return (
      <Page header={<Title title={'LH 공고 상세'} />} footer={<Navi data={upDateLogin ? undefined : naviDB.guestList} loginDetail={upDateLogin || undefined} onClick={upDateLogin ? handleLogout : undefined} />}>
        <ExpiredNotice
          itemTitle={item.PAN_NM}
          label="공고"
          onRemove={isWishlisted ? doToggle : undefined}
        />
      </Page>
    );
  }

  const dday      = getDdayInfo(item.CLSG_DT);
  const typeCode  = String(item.AIS_TP_CD || '');
  const typeName  = item.AIS_TP_NM || item.AIS_TP_CD_NM || TYPE_INFO[typeCode]?.label || 'LH';
  const typeColor = TYPE_INFO[typeCode]?.color || (YOUTH_TYPES.includes(typeName) ? '#1565C0' : '#003D7C');
  const regionName = item.SIDO_NM || item.CNP_CD_NM || '';

  // LH 청약센터 딥링크
  const applyUrl = item.PAN_ID
    ? `https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancInfo.do?panId=${item.PAN_ID}&ccrCnntSysDsCd=${item.CCR_CNNT_SYS_DS_CD || '03'}&uppAisTpCd=${item.UPP_AIS_TP_CD || ''}&aisTpCd=${typeCode}&mi=1026`
    : 'https://apply.lh.or.kr';

  // 상세 데이터 추출 헬퍼
  const toArr = (val) => Array.isArray(val) ? val : val ? [val] : [];
  const ctrtPlc   = toArr(detail?.dsCtrtPlc)[0]   || null;  // 접수처
  const sbdList   = toArr(detail?.dsSbd);                    // 단지 목록
  const sbdNmMap  = toArr(detail?.dsSbdNm)[0]     || {};    // 단지 필드 레이블
  const splScdl   = toArr(detail?.dsSplScdl);               // 공급 일정
  const splScdl01 = toArr(detail?.dsSplScdl01);             // 공급 일정(입찰)
  const splScdl02 = toArr(detail?.dsSplScdl02);             // 공급 일정(추첨)
  const ahflList  = toArr(detail?.dsAhflInfo);               // 첨부파일
  const etcList   = toArr(detail?.dsEtcInfo);                // 기타정보
  const etcNmMap  = toArr(detail?.dsEtcInfoNm)[0] || {};    // 기타정보 필드 레이블
  const sbdAhfl   = toArr(detail?.dsSbdAhfl);               // 단지 이미지

  return (
    <Page
      header={<Title title={'LH 공고 상세'} />}
      footer={<Navi data={upDateLogin ? undefined : naviDB.guestList} loginDetail={upDateLogin || undefined} onClick={upDateLogin ? handleLogout : undefined} />}
    >
      <div className="detail pol-detail lh-detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>← 목록으로</button>

        {/* ── 헤더 ── */}
        <div className="pol-header">
          <span className="pol-badge" style={{ background: typeColor, color: '#fff' }}>
            {typeName}
          </span>
          {regionName && <span className="pol-org">{regionName}</span>}
          {item.PAN_SS && (
            <span className={`lh-status-badge${item.PAN_SS.includes('공고') ? ' active' : ''}`}>
              {item.PAN_SS}
            </span>
          )}
        </div>
        <h3 className="pol-title">{item.PAN_NM || '공고명 없음'}</h3>

        {/* D-day */}
        {dday !== null && dday >= 0 && dday <= 7 && (
          <div className="pol-urgent">마감까지 <strong>{dday === 0 ? '오늘까지' : `${dday}일`}</strong> 남았습니다!</div>
        )}
        {dday !== null && dday < 0 && (
          <div className="pol-expired">이 공고의 모집 기간이 종료되었습니다.</div>
        )}

        {/* ── 공고 기간 ── */}
        {(item.PAN_DT || item.CLSG_DT) && (
          <div className="pol-section">
            <h4 className="pol-section-title">공고 기간</h4>
            <div className="pol-section-body">
              <div className="pol-period-row">
                <span>{item.PAN_DT ? formatDate(item.PAN_DT) : formatDate(item.PAN_NT_ST_DT) || '정보없음'}</span>
                <span className="pol-period-sep">~</span>
                <span className={dday !== null && dday >= 0 && dday <= 7 ? 'pol-date-urgent' : ''}>
                  {item.CLSG_DT ? formatDate(item.CLSG_DT) : '정보없음'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── 상세정보 로딩 중 ── */}
        {detailLoading && (
          <div className="lh-detail-loading">상세 정보 불러오는 중...</div>
        )}

        {/* ── 상세정보 로드 실패 안내 ── */}
        {!detailLoading && detailError && (
          <div className="lh-detail-notice">
            상세 정보를 불러올 수 없습니다. LH 청약센터에서 직접 확인해 주세요.
          </div>
        )}

        {/* ── 단지 정보 ── */}
        {!detailLoading && sbdList.length > 0 && (
          <div className="pol-section">
            <h4 className="pol-section-title">단지 정보</h4>
            {sbdList.map((sbd, idx) => (
              <div key={idx} className="lh-dtl-card">
                {/* 단지명: 주거 → BZDT_NM/SBD_LGO_NM, 임대상가 → SBD_NM */}
                {(sbd.BZDT_NM || sbd.SBD_LGO_NM || sbd.SBD_NM) && (
                  <p className="lh-dtl-complex-name">
                    {sbd.BZDT_NM || sbd.SBD_LGO_NM || sbd.SBD_NM}
                  </p>
                )}
                <div className="pol-section-body">
                  {(sbd.LCT_ARA_ADR || sbd.LCT_ARA_DTL_ADR) && (
                    <div className="pol-info-row">
                      <span className="pol-label">주소</span>
                      <span className="pol-value">{[sbd.LCT_ARA_ADR, sbd.LCT_ARA_DTL_ADR].filter(Boolean).join(' ')}</span>
                    </div>
                  )}
                  {(sbd.MIN_MAX_RSDN_DDO_AR || sbd.SC_AR) && (
                    <div className="pol-info-row">
                      <span className="pol-label">전용면적</span>
                      <span className="pol-value">{sbd.MIN_MAX_RSDN_DDO_AR || sbd.SC_AR}㎡</span>
                    </div>
                  )}
                  {(sbd.SUM_TOT_HSH_CNT || sbd.HSH_CNT) && (
                    <div className="pol-info-row">
                      <span className="pol-label">총 세대수</span>
                      <span className="pol-value">{(sbd.SUM_TOT_HSH_CNT || sbd.HSH_CNT).toLocaleString()}세대</span>
                    </div>
                  )}
                  {sbd.HTN_FMLA_DS_CD_NM && (
                    <div className="pol-info-row">
                      <span className="pol-label">난방방식</span>
                      <span className="pol-value">{sbd.HTN_FMLA_DS_CD_NM}</span>
                    </div>
                  )}
                  {sbd.MVIN_XPC_YM && (
                    <div className="pol-info-row">
                      <span className="pol-label">입주 예정</span>
                      <span className="pol-value">{sbd.MVIN_XPC_YM}</span>
                    </div>
                  )}
                  {sbd.TFFC_FCL_CTS && (
                    <div className="pol-info-row">
                      <span className="pol-label">교통 여건</span>
                      <span className="pol-value">{sbd.TFFC_FCL_CTS}</span>
                    </div>
                  )}
                  {sbd.EDC_FCL_CTS && (
                    <div className="pol-info-row">
                      <span className="pol-label">교육 환경</span>
                      <span className="pol-value">{sbd.EDC_FCL_CTS}</span>
                    </div>
                  )}
                  {sbd.CVN_FCL_CTS && (
                    <div className="pol-info-row">
                      <span className="pol-label">편의 시설</span>
                      <span className="pol-value">{sbd.CVN_FCL_CTS}</span>
                    </div>
                  )}
                  {sbd.SBD_INF_CTS && (
                    <div className="pol-info-row">
                      <span className="pol-label">{sbdNmMap.SBD_INF_CTS || '단지정보'}</span>
                      <span className="pol-value">{sbd.SBD_INF_CTS}</span>
                    </div>
                  )}
                  {sbd.MSH_XPC_CTS && (
                    <div className="pol-info-row">
                      <span className="pol-label">{sbdNmMap.MSH_XPC_CTS || '입점시기'}</span>
                      <span className="pol-value">{sbd.MSH_XPC_CTS}</span>
                    </div>
                  )}
                  {sbd.SPL_INF_GUD_FCTS && (
                    <div className="pol-info-row">
                      <span className="pol-label">안내사항</span>
                      <span className="pol-value pol-long">{sbd.SPL_INF_GUD_FCTS}</span>
                    </div>
                  )}
                </div>
                {/* 단지 이미지 */}
                {sbdAhfl.filter(f => f.BZDT_NM === sbd.BZDT_NM || f.SBD_LGO_NM === sbd.SBD_LGO_NM).length > 0 && (
                  <div className="lh-dtl-images">
                    {sbdAhfl.filter(f => f.BZDT_NM === sbd.BZDT_NM || f.SBD_LGO_NM === sbd.SBD_LGO_NM).map((img, ii) => (
                      <a key={ii} href={img.AHFL_URL} target="_blank" rel="noopener noreferrer" className="lh-dtl-img-link">
                        {img.LS_SPL_INF_UPL_FL_DS_CD_NM || img.CMN_AHFL_NM}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── 접수처 정보 ── */}
        {!detailLoading && ctrtPlc && (
          <div className="pol-section">
            <h4 className="pol-section-title">접수처 정보</h4>
            <div className="pol-section-body">
              {(ctrtPlc.CTRT_PLC_ADR || ctrtPlc.CTRT_PLC_DTL_ADR) && (
                <div className="pol-info-row">
                  <span className="pol-label">주소</span>
                  <span className="pol-value">{[ctrtPlc.CTRT_PLC_ADR, ctrtPlc.CTRT_PLC_DTL_ADR].filter(Boolean).join(' ')}</span>
                </div>
              )}
              {ctrtPlc.SIL_OFC_TLNO && (
                <div className="pol-info-row">
                  <span className="pol-label">전화번호</span>
                  <span className="pol-value">
                    <a href={`tel:${ctrtPlc.SIL_OFC_TLNO}`} className="lh-tel-link">{ctrtPlc.SIL_OFC_TLNO}</a>
                  </span>
                </div>
              )}
              {ctrtPlc.SIL_OFC_DT && (
                <div className="pol-info-row">
                  <span className="pol-label">운영 기간</span>
                  <span className="pol-value">{ctrtPlc.SIL_OFC_DT}</span>
                </div>
              )}
              {ctrtPlc.SIL_OFC_GUD_FCTS && (
                <div className="pol-info-row">
                  <span className="pol-label">안내사항</span>
                  <span className="pol-value pol-long">{ctrtPlc.SIL_OFC_GUD_FCTS}</span>
                </div>
              )}
              {ctrtPlc.PAN_DTL_CTS && (
                <div className="pol-info-row">
                  <span className="pol-label">공고 내용</span>
                  <span className="pol-value pol-long">{ctrtPlc.PAN_DTL_CTS}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 공급 일정 ── */}
        {!detailLoading && (splScdl.length > 0 || splScdl01.length > 0 || splScdl02.length > 0) && (
          <div className="pol-section">
            <h4 className="pol-section-title">공급 일정</h4>
            <div className="pol-section-body">
              {/* 일반 공급 일정 */}
              {splScdl.map((s, idx) => (
                <div key={idx} className="lh-dtl-schedule">
                  {s.HS_SBSC_ACP_TRG_CD_NM && (
                    <p className="lh-dtl-sched-title">{s.HS_SBSC_ACP_TRG_CD_NM}</p>
                  )}
                  {/* 신청 일시: 단일 or 시작/종료 범위 */}
                  {s.ACP_DTTM && (
                    <div className="pol-info-row">
                      <span className="pol-label">신청 일시</span>
                      <span className="pol-value">{s.ACP_DTTM}</span>
                    </div>
                  )}
                  {(s.ACP_ST_DTTM || s.ACP_ED_DTTM) && (
                    <div className="pol-info-row">
                      <span className="pol-label">신청 기간</span>
                      <span className="pol-value">
                        {s.ACP_ST_DTTM && s.ACP_ED_DTTM
                          ? `${s.ACP_ST_DTTM} ~ ${s.ACP_ED_DTTM}`
                          : s.ACP_ST_DTTM || s.ACP_ED_DTTM}
                      </span>
                    </div>
                  )}
                  {s.LTR_DTTM && (
                    <div className="pol-info-row">
                      <span className="pol-label">추첨 일시</span>
                      <span className="pol-value">{s.LTR_DTTM}</span>
                    </div>
                  )}
                  {s.RMK && (
                    <div className="pol-info-row">
                      <span className="pol-label">신청 방법</span>
                      <span className="pol-value">{s.RMK}</span>
                    </div>
                  )}
                  {s.PZWR_ANC_DT && (
                    <div className="pol-info-row">
                      <span className="pol-label">당첨자 발표</span>
                      <span className="pol-value">{formatDate(s.PZWR_ANC_DT)}</span>
                    </div>
                  )}
                  {(s.PZWR_PPR_SBM_ST_DT || s.PZWR_PPR_SBM_ED_DT) && (
                    <div className="pol-info-row">
                      <span className="pol-label">서류 제출</span>
                      <span className="pol-value">{dateRange(s.PZWR_PPR_SBM_ST_DT, s.PZWR_PPR_SBM_ED_DT)}</span>
                    </div>
                  )}
                  {(s.CTRT_ST_DT || s.CTRT_ED_DT) && (
                    <div className="pol-info-row">
                      <span className="pol-label">계약 체결</span>
                      <span className="pol-value">{dateRange(s.CTRT_ST_DT, s.CTRT_ED_DT)}</span>
                    </div>
                  )}
                  {s.SPL_SCD_GUD_FCTS && (
                    <div className="pol-info-row">
                      <span className="pol-label">안내사항</span>
                      <span className="pol-value pol-long">{s.SPL_SCD_GUD_FCTS}</span>
                    </div>
                  )}
                </div>
              ))}
              {/* 추첨 일정 */}
              {splScdl02.map((s, idx) => (
                <div key={idx} className="lh-dtl-schedule">
                  <p className="lh-dtl-sched-title">추첨 신청</p>
                  {s.RQS_DTTM && <div className="pol-info-row"><span className="pol-label">신청 일시</span><span className="pol-value">{s.RQS_DTTM}</span></div>}
                  {s.LTR_DTTM && <div className="pol-info-row"><span className="pol-label">추첨 일정</span><span className="pol-value">{s.LTR_DTTM}</span></div>}
                  {s.PZWR_NT_DTTM && <div className="pol-info-row"><span className="pol-label">결과 발표</span><span className="pol-value">{s.PZWR_NT_DTTM}</span></div>}
                  {(s.CTRT_ST_DT || s.CTRT_ED_DT) && <div className="pol-info-row"><span className="pol-label">계약 체결</span><span className="pol-value">{dateRange(s.CTRT_ST_DT, s.CTRT_ED_DT)}</span></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 첨부파일 ── */}
        {!detailLoading && ahflList.length > 0 && (
          <div className="pol-section">
            <h4 className="pol-section-title">첨부 파일</h4>
            <div className="pol-section-body">
              <ul className="lh-dtl-files">
                {ahflList.map((f, idx) => (
                  <li key={idx} className="lh-dtl-file-item">
                    {/* <span className="lh-dtl-file-icon">{fileIcon(f.CMN_AHFL_NM)}</span> */}
                    <div className="lh-dtl-file-info">
                      {f.SL_PAN_AHFL_DS_CD_NM && (
                        <span className="lh-dtl-file-type">{f.SL_PAN_AHFL_DS_CD_NM}</span>
                      )}
                      <span className="lh-dtl-file-name">{f.CMN_AHFL_NM}</span>
                    </div>
                    {f.AHFL_URL && (
                      <a
                        href={f.AHFL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lh-dtl-file-btn"
                        download
                      >
                        다운로드
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── 기타 정보 ── */}
        {!detailLoading && etcList.length > 0 && (
          <div className="pol-section">
            <h4 className="pol-section-title">기타 안내</h4>
            <div className="pol-section-body">
              {etcList.map((etc, idx) => {
                // dsEtcInfoNm이 있으면 해당 레이블 맵으로 모든 필드 동적 렌더링
                // 없으면 기존 방식(PAN_DTL_CTS / ETC_CTS)으로 fallback
                const hasNmMap = Object.keys(etcNmMap).length > 0;
                if (hasNmMap) {
                  return (
                    <div key={idx}>
                      {Object.entries(etcNmMap).map(([key, label]) =>
                        etc[key] ? (
                          <div key={key} className="pol-info-row lh-etc-row">
                            <span className="pol-label">{label}</span>
                            <span className="pol-value pol-long">{etc[key]}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  );
                }
                return (etc.PAN_DTL_CTS || etc.ETC_CTS) ? (
                  <div key={idx} className="pol-info-row lh-etc-row">
                    {etc.PAN_ETC_INF_CD_NM && (
                      <span className="pol-label">{etc.PAN_ETC_INF_CD_NM}</span>
                    )}
                    <span className="pol-value pol-long">{etc.PAN_DTL_CTS || etc.ETC_CTS}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* ── 신청 안내 ── */}
        <div className="pol-section">
          <h4 className="pol-section-title">청약 신청</h4>
          <div className="pol-section-body">
            <p className="pol-long-text lh-apply-notice">
              LH 청약센터에서 공고 전문 및 상세 신청 자격을 확인하세요.<br/>
              자격 요건, 공급 가구 수, 임대 조건은 반드시 공고문 원문을 확인하시기 바랍니다.
            </p>
            <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="pol-link primary">
              LH 청약센터에서 공고 확인·신청하기 →
            </a>
            <a href="https://apply.lh.or.kr" target="_blank" rel="noopener noreferrer" className="pol-link">
              LH 청약센터 홈
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

export default LhDetail;
