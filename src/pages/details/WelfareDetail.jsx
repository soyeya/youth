import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page.jsx';
import Title from '../../components/Title.jsx';
import Navi from '../../components/Navi.jsx';
import naviDB from '../../json/navi.json';
import Detail from '../../components/Detail';
import ExpiredNotice from '../../components/ExpiredNotice';
import * as MyLayout from '../../lib/MyLayout.jsx';
import API_BASE from '../../utils/apiConfig';
import useLoginStatus from '../../utils/useLoginStatus';
import useWishlist from '../../utils/useWishlist';

const WelfareDetails = () => {
  const [policyData, setPolicyData] = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const { startLoading, finishLoading } = MyLayout.useLoading();
  const location  = useLocation();
  const rawParams = useParams();
  const fromWishlist = !!location.state?.fromWishlist;
  const { upDateLogin, dataContent, logout } = useLoginStatus();
  const handleLogout = async () => { await logout(startLoading, finishLoading); };

  /**
   * 와일드카드 라우트 `/details/welfare/*` 에서 실제 정책명을 추출.
   * 구버전 찜 URL 형식 "/region/title" 도 처리: 마지막 세그먼트가 title.
   */
  const rawSplat = rawParams['*'] || '';
  const segments = rawSplat.split('/').filter(Boolean);
  const values   = decodeURIComponent(segments[segments.length - 1] || rawSplat);

  const link = `/details/welfare/${encodeURIComponent(values)}`;
  const { isWishlisted, toggleWishlist } = useWishlist({
    userId:   upDateLogin ? dataContent?.[0] : null,
    section:  '복지',
    link,
    title:    values,
    applyEnd: policyData?.applyEnd || null,
  });
  const doToggle = async () => {
    const { msg } = await toggleWishlist();
    if (msg) alert(msg);
  };

  const loadDetail = async () => {
    if (!values) return;
    startLoading('정책 정보 불러오는 중...');
    try {
      const res = await axios.get(`${API_BASE}/welfareApi`);
      const rawData = res.data.youthPolicyList;
      if (!rawData) { setNotFound(true); return; }

      const list  = Array.isArray(rawData) ? rawData : [rawData];
      const found = list.find((item) => item.plcyNm === values);

      if (found) {
        setPolicyData({
          title:          found.plcyNm,
          category:       '복지',
          info:           found.plcyExplnCn,
          etct:           found.plcySprtCn,
          administration: found.sprvsnInstCdNm,
          operInst:       found.operInstNm,
          address:        found.aplyUrlAddr  || found.refUrlAddr1 || '',
          refUrl1:        found.refUrlAddr1,
          refUrl2:        found.refUrlAddr2,
          applyMethod:    found.srchPlcyWayNm,
          ageInfo:        found.ageInfo,
          empStatus:      found.empmSttsNm,
          eduLevel:       found.scholrTyNm,
          marryStatus:    found.mrrgSttsNm,
          bizStart:       found.bizPrdStrtYmd,
          bizEnd:         found.bizPrdEndYmd,
          applyStart:     found.rqutPrdStrtYmd,
          applyEnd:       found.rqutPrdEndYmd,
        });
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.log('WelfareDetail 로드 오류:', err.message || err);
      setNotFound(true);
    } finally {
      finishLoading();
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const pageHeader = <Title title={'복지 정책 상세'} />;
  const pageFooter = upDateLogin
    ? <Navi loginDetail onClick={handleLogout} />
    : <Navi data={naviDB.guestList} />;

  if (notFound && fromWishlist) {
    return (
      <Page header={pageHeader} footer={pageFooter}>
        <ExpiredNotice
          itemTitle={values}
          label="정책"
          onRemove={isWishlisted ? doToggle : undefined}
        />
      </Page>
    );
  }

  return (
    <Page header={pageHeader} footer={pageFooter}>
      <Detail
        policyData={policyData}
        isWishlisted={isWishlisted}
        onClick={doToggle}
      />
    </Page>
  );
};

export default WelfareDetails;
