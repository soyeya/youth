import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page';
import Title from '../../components/Title';
import Navi from '../../components/Navi';
import NaviDB from '../../json/navi.json';
import selectDB from '../../json/select.json';
import FinanceInfo from '../../components/FinanceInfo';
import * as MyLayout from '../../lib/MyLayout';
import API_BASE from '../../utils/apiConfig';
import useLoginStatus from '../../utils/useLoginStatus';

const LOAN_TYPES = ['주택담보대출', '전세자금대출', '개인신용대출'];

// ──────────────────────────────────────────────────────────
// 상품별 optionList 금리 추출
//   - 연금저축: 금리 필드 없음 → 0 반환 (rate sort 비활성화)
//   - 주택담보대출·전세자금대출: lend_rate_avg / lend_rate_min
//   - 개인신용대출:              crdt_grad_avg / crdt_grad_1~10
//   - 정기예금·적금:             intr_rate2 / intr_rate
// ──────────────────────────────────────────────────────────
const extractRateFromOption = (opt, isLoanType, productType) => {
  if (productType === '연금저축') return 0; // 연금저축은 금리 기반 정렬 불가

  if (!isLoanType) {
    return parseFloat(opt.intr_rate2 || opt.intr_rate || 0);
  }
  if (productType === '개인신용대출') {
    if (opt.crdt_grad_avg) return parseFloat(opt.crdt_grad_avg);
    const grades = [];
    for (let i = 1; i <= 10; i++) {
      const v = parseFloat(opt[`crdt_grad_${i}`]);
      if (!isNaN(v) && v > 0) grades.push(v);
    }
    return grades.length > 0 ? grades.reduce((s, v) => s + v, 0) / grades.length : 0;
  }
  return parseFloat(opt.lend_rate_avg || opt.lend_rate_min || 0);
};

// ──────────────────────────────────────────────────────────
// 리스트 항목에 표시할 유형명 추출
//   - 연금저축: baseList의 pnsn_kind_nm (연금저축신탁/보험/펀드)
//   - 개인신용대출: crdt_prdt_type_nm
//   - 기타 대출: lend_rate_type_nm / rpay_type_nm
//   - 예·적금: rsrv_type_nm
// ──────────────────────────────────────────────────────────
const extractTypenm = (opt, productType) => {
  if (!opt) return '-';
  if (productType === '개인신용대출') {
    return opt.crdt_prdt_type_nm || opt.crdt_lend_rate_type_nm || '-';
  }
  if (LOAN_TYPES.includes(productType)) {
    return opt.lend_rate_type_nm || opt.rpay_type_nm || '-';
  }
  return opt.rsrv_type_nm || '-';
};

const Finance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || selectDB.bank[0].name;
  const initialSort = searchParams.get('sort') || 'latest';

  const [rawData, setRawData] = useState([]);
  const [href, setHref] = useState('');
  const [selectedType, setSelectedType] = useState(initialType);
  const [sortType, setSortType] = useState(initialSort);
  const { startLoading, finishLoading } = MyLayout.useLoading();
  const { upDateLogin, logout } = useLoginStatus();

  const isLoan = LOAN_TYPES.includes(selectedType);
  const isPension = selectedType === '연금저축'; // 연금저축 여부 플래그

  const loadFinanceData = async (value) => {
    if (!value) return;
    startLoading(`${value} 검색중...`);
    try {
      const res = await axios.post(`${API_BASE}/financeApi`, { [value]: value });
      const res_data = res.data.baseList;

      if (!res_data || res_data.length === 0) {
        setRawData([]);
        setHref('');
        return;
      }

      const optionList = res.data.optionList || [];
      const list = Array.isArray(res_data) ? res_data : [res_data];
      const isLoanType = LOAN_TYPES.includes(value);

      const items = list.map((item) => {
        const opts = optionList.filter(
          (opt) => opt.fin_prdt_cd === item.fin_prdt_cd
        );

        let rateDisplay = '';
        let rateSort = 0;

        if (value === '연금저축') {
          // 연금저축: 금리 없음, pnsn_kind_nm을 유형명으로 사용
          rateDisplay = '';
          rateSort = 0;
        } else if (isLoanType) {
          const rates = opts
            .map((o) => extractRateFromOption(o, true, value))
            .filter((r) => r > 0);
          if (rates.length > 0) {
            const minRate = Math.min(...rates);
            rateDisplay = `평균 ${minRate.toFixed(2)}%`;
            rateSort = minRate;
          }
        } else {
          const rates = opts
            .map((o) => extractRateFromOption(o, false, value))
            .filter((r) => r > 0);
          if (rates.length > 0) {
            const maxRate = Math.max(...rates);
            rateDisplay = `최고 ${maxRate.toFixed(2)}%`;
            rateSort = maxRate;
          }
        }

        // 유형명: 연금저축은 baseList의 pnsn_kind_nm 사용
        const typenm =
          value === '연금저축'
            ? item.pnsn_kind_nm || '-'
            : extractTypenm(opts[0], value);

        return {
          title: item.kor_co_nm,
          prdtnm: item.fin_prdt_nm,
          typenm,
          start: item.dcls_strt_day,
          rateDisplay,
          rateSort,
        };
      });

      setRawData(items);
      setHref(`/details/finance/${value}`);
    } catch (err) {
      console.log('finance 데이터 로드 오류:', err.message || err);
      setRawData([]);
      setHref('');
    } finally {
      finishLoading();
    }
  };

  const sortedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return rawData;
    const copy = [...rawData];

    if (sortType === 'latest') {
      copy.sort((a, b) => {
        const da = a.start ? a.start.replace(/[^0-9]/g, '') : '0';
        const db = b.start ? b.start.replace(/[^0-9]/g, '') : '0';
        return db.localeCompare(da);
      });
    } else {
      // 연금저축은 rateSort=0이므로 rate sort를 선택해도 순서 변화 없음
      if (isLoan) {
        copy.sort((a, b) => {
          if (a.rateSort === 0) return 1;
          if (b.rateSort === 0) return -1;
          return a.rateSort - b.rateSort;
        });
      } else {
        copy.sort((a, b) => {
          if (a.rateSort === 0) return 1;
          if (b.rateSort === 0) return -1;
          return b.rateSort - a.rateSort;
        });
      }
    }
    return copy;
  }, [rawData, sortType, isLoan]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedType(value);
    setSortType('latest'); // 상품 유형 변경 시 항상 최신순으로 초기화
    setSearchParams({ type: value, sort: 'latest' });
    loadFinanceData(value);
  };

  const handleSortChange = (newSort) => {
    setSortType(newSort);
    setSearchParams({ type: selectedType, sort: newSort });
  };

  const handleLogout = async () => {
    await logout(startLoading, finishLoading);
  };

  useEffect(() => {
    loadFinanceData(initialType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page
      header={<Title title={'금융'} backURL={'/'} />}
      footer={
        upDateLogin ? (
          <Navi loginUpload color onClick={handleLogout} />
        ) : (
          <Navi data={NaviDB.guestList} />
        )
      }
    >
      <FinanceInfo
        id={'금융'}
        data={selectDB.bank}
        onChange={handleChange}
        dataName={sortedData}
        name={href}
        selectedType={selectedType}
        sortType={sortType}
        onSortChange={handleSortChange}
        isLoan={isLoan}
        isPension={isPension}
      />
    </Page>
  );
};

export default Finance;
