import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page.jsx';
import Title from '../../components/Title.jsx';
import Navi from '../../components/Navi.jsx';
import naviDB from '../../json/navi.json';
import FinDetail from './FinDetail.jsx';
import * as MyLayout from '../../lib/MyLayout.jsx';
import API_BASE from '../../utils/apiConfig';
import useLoginStatus from '../../utils/useLoginStatus';
import useWishlist from '../../utils/useWishlist';

const JOIN_DENY_MAP = { '1': '제한없음', '2': '서민전용', '3': '일부제한' };

const FinanceDetails = () => {
  const params = useParams();
  const [detailData, setDetailData] = useState(null);
  const { startLoading, finishLoading } = MyLayout.useLoading();
  const { values, name } = params;  // name: 상품유형, values: 상품명
  const { upDateLogin, dataContent, logout } = useLoginStatus();
  const handleLogout = async () => { await logout(startLoading, finishLoading); };

  const link = `/details/finance/${name}/${values}`;
  const { isWishlisted, toggleWishlist } = useWishlist({
    userId:   upDateLogin ? dataContent?.[0] : null,
    section:  '금융',
    link,
    title:    values,
    applyEnd: null,
    banknm:   detailData?.baseData?.banknm || null,
  });
  const doToggle = async () => {
    const { msg } = await toggleWishlist();
    if (msg) alert(msg);
  };

  const loadDetail = async () => {
    startLoading('금융 상품 정보 불러오는 중...');
    try {
      const res = await axios.post(`${API_BASE}/financeApi`, { [name]: name });
      const baseList   = res.data.baseList   || [];
      const optionList = res.data.optionList || [];

      const found = (Array.isArray(baseList) ? baseList : [baseList])
        .find((item) => item.fin_prdt_nm === values);

      if (!found) { finishLoading(); return; }

      // 이 상품의 옵션 행만 필터
      const myOptions = optionList.filter(
        (opt) => opt.fin_prdt_cd === found.fin_prdt_cd
      );

      // join_deny 코드 → 한글
      const joinDeny = JOIN_DENY_MAP[String(found.join_deny)] || String(found.join_deny || '');

      // 공통 baseData
      const baseData = {
        banknm:        found.kor_co_nm,
        prdtnm:        found.fin_prdt_nm,
        joinWay:       found.join_way,
        joinDeny,
        spcl:          found.spcl_cnd,
        start:         found.dcls_strt_day,
        expire:        found.dcls_end_day,
        dlyRate:       found.dly_rate,         // 연체이자율 (대출·예금 공통)
        erlyFee:       found.erly_rpay_fee,    // 중도상환수수료
        loanLmt:       found.loan_lmt,         // 대출한도
        // 예금·적금 전용
        joinMember:    found.join_member,
        etcNote:       found.etc_note,
        mtrtInt:       found.mtrt_int,         // 만기 후 이자율
        maxLimit:      found.max_limit,        // 최고 한도
        // 대출 전용
        loanInciExpn:  found.loan_inci_expn,   // 부대비용
        // 개인신용대출 전용
        cbName:        found.cb_name,          // 신용조회기관
        // 연금저축 전용
        pnsnKindNm:    found.pnsn_kind_nm,
        prdtTypeNm:    found.prdt_type_nm,
        saleCo:        found.sale_co,
      };

      setDetailData({ baseData, options: myOptions });
    } catch (err) {
      console.log('FinanceDetail 로드 오류:', err.message || err);
      // 데이터 로드 실패 시 로딩만 종료
    } finally {
      finishLoading();
    }
  };



  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, name]);

  /**
   * 이미 찜된 항목이고 banknm이 로드됐으면 DB 업데이트
   * (이전에 저장된 항목 중 banknm=null인 것을 자동 보완)
   */
  useEffect(() => {
    const uid    = upDateLogin ? dataContent?.[0] : null;
    const banknm = detailData?.baseData?.banknm;
    if (!uid || !isWishlisted || !banknm) return;

    axios.patch(`${API_BASE}/MyList/banknm`, { userId: uid, title: values, banknm })
      .catch(() => {}); // 실패해도 UX 영향 없음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWishlisted, detailData]);

  return (
    <Page
      header={<Title title={'금융 상품 상세'} />}
      footer={upDateLogin ? <Navi loginDetail onClick={handleLogout} /> : <Navi data={naviDB.guestList} />}
    >
      <FinDetail
        productType={name}
        data={detailData}
        title={values}
        isWishlisted={isWishlisted}
        onClick={doToggle}
      />
    </Page>
  );
};

export default FinanceDetails;
