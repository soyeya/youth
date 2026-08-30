import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Info from '../../components/Info';
import Page from '../../components/Page';
import Title from '../../components/Title';
import Navi from '../../components/Navi';
import NaviDB from '../../json/navi.json';
import * as MyLayout from '../../lib/MyLayout';
import API_BASE from '../../utils/apiConfig';
import useLoginStatus from '../../utils/useLoginStatus';

const Education = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort = searchParams.get('sort') || 'latest';

  const [rawItems, setRawItems] = useState(false);
  const [sortType, setSortType] = useState(initialSort);
  const { startLoading, finishLoading } = MyLayout.useLoading();
  const { upDateLogin, logout } = useLoginStatus();

  const loadData = async () => {
    startLoading('교육 정책 불러오는 중...');
    try {
      const res = await axios.get(`${API_BASE}/educationApi`);
      const res_data = res.data.youthPolicyList;
      if (!res_data) { setRawItems([]); return; }

      const list = Array.isArray(res_data) ? res_data : [res_data];

      // 카테고리 코드로 정확히 필터링 (서버 필터 + 클라이언트 이중 필터)
      const filtered = list.filter((item) => item.bscPlanPlcyWayNo === '003');

      const items = filtered.map((item) => ({
        title:      item.plcyNm,
        desc:       item.plcySprtCn,
        // bizPrdStrtYmd(사업시작일) → 최신순 기준 (확실히 있는 필드)
        bizStart:   item.bizPrdStrtYmd || '',
        // bizPrdEndYmd(사업종료일) → 마감 임박순 기준 (확실히 있는 필드)
        applyEnd:   item.bizPrdEndYmd  || '',
      }));

      setRawItems(items);
    } catch (err) {
      console.log('교육 데이터 로드 오류:', err.message || err);
      setRawItems([]);
    } finally {
      finishLoading();
    }
  };

  const sortedItems = useMemo(() => {
    if (!Array.isArray(rawItems) || rawItems.length === 0) return rawItems;
    const copy = [...rawItems];

    if (sortType === 'latest') {
      // 최신순: 사업 시작일(bizPrdStrtYmd) 내림차순
      copy.sort((a, b) => {
        const da = a.bizStart ? a.bizStart.replace(/[^0-9]/g, '') : '0';
        const db = b.bizStart ? b.bizStart.replace(/[^0-9]/g, '') : '0';
        return db.localeCompare(da);
      });
    } else {
      // 마감 임박순: 사업 종료일(bizPrdEndYmd) 오름차순 (날짜 없는 건 맨 뒤)
      copy.sort((a, b) => {
        const da = a.applyEnd ? a.applyEnd.replace(/[^0-9]/g, '') : '99999999';
        const db = b.applyEnd ? b.applyEnd.replace(/[^0-9]/g, '') : '99999999';
        return da.localeCompare(db);
      });
    }
    return copy;
  }, [rawItems, sortType]);

  const handleSortChange = (newSort) => {
    setSortType(newSort);
    setSearchParams({ sort: newSort });
  };

  const handleLogout = async () => {
    await logout(startLoading, finishLoading);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page
      header={<Title title={'교육'} backURL={'/'} />}
      footer={
        upDateLogin ? (
          <Navi loginUpload color onClick={handleLogout} />
        ) : (
          <Navi data={NaviDB.guestList} />
        )
      }
    >
      <Info
        id={'교육'}
        name={'/details/education'}
        items={sortedItems}
        sortType={sortType}
        onSortChange={handleSortChange}
      />
    </Page>
  );
};

export default Education;
