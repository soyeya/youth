import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Page from '../components/Page';
import Title from '../components/Title';
import Navi from '../components/Navi';
import NaviDB from '../json/navi.json';
import Category from './Category';
import Board from './Board';
import * as MyLayout from '../lib/MyLayout';
import loadingImg from '../assets/img/toyouth.png';
import OpenPage from '../components/OpenPage';
import logo from '../assets/img/toyouth.png';
import API_BASE from '../utils/apiConfig';
import useLoginStatus from '../utils/useLoginStatus';

const Home = () => {
  const [dataList, setDataList] = useState([]);
  const { startLoading, finishLoading } = MyLayout.useLoading();
  const { openDialog, closeDialog } = MyLayout.useDialog();
  const { upDateLogin, logout } = useLoginStatus();

  const news = async () => {
    try {
      startLoading('NEWS 불러오는중...');
      const res = await axios.get(`${API_BASE}/newsApi`);
      const res_data = res.data.youthPolicyList;

      if (!res_data) {
        setDataList([]);
        return;
      }

      const list = Array.isArray(res_data) ? res_data : [res_data];
      const filtered = list
        .filter((item) => item.bscPlanPlcyWayNo === '001')
        .map((item) => ({
          title: item.plcyNm,
          administration: item.plcySprtCn,
          startDate: item.bizPrdStrtYmd || '',  // 사업 시작일 (최신순 정렬용)
          endDate: item.bizPrdEndYmd || '',      // 사업 종료일 (인기순 = 마감 임박순)
        }));

      setDataList(filtered);
    } catch (err) {
      console.log(`${err}, homeApi`);
      setDataList([]);
    } finally {
      finishLoading();
    }
  };

  const onClick = async () => {
    if (!upDateLogin) return;
    await logout(startLoading, finishLoading);
  };

  useEffect(() => {
    const openEvt = () => {
      window.addEventListener('load', () => {
        openDialog(
          <OpenPage>
            <img src={loadingImg} alt="loading" />
          </OpenPage>
        );
        setTimeout(() => {
          closeDialog();
        }, 2500);
      });
    };
    openEvt();
    news();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page
      header={<Title title={<img src={logo} alt="to youth" />} color />}
      footer={
        upDateLogin ? (
          <Navi loginUpload color onClick={onClick} />
        ) : (
          <Navi data={NaviDB.home} color />
        )
      }
    >
      <Category />
      <Board boardList={dataList} />
    </Page>
  );
};

export default Home;
