import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from './apiConfig';

// 로그인 상태 확인 공통 훅
// 백엔드가 없을 때(GitHub Pages 등)는 조용히 실패하고 비로그인 상태로 유지
const useLoginStatus = () => {
  const [upDateLogin, setUpdateLogin] = useState(false);
  const [dataContent, setDataContent] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axios.get(`${API_BASE}/LoginList`);
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setUpdateLogin(true);
          setDataContent([data[0].userId, data[0].userPassword]);
        } else {
          setUpdateLogin(false);
        }
      } catch (err) {
        // 백엔드 미연결 시 조용히 비로그인 처리
        setUpdateLogin(false);
      }
    };
    checkLogin();
  }, []);

  const logout = async (startLoading, finishLoading) => {
    if (!upDateLogin || !dataContent) return;
    try {
      if (startLoading) startLoading('로그아웃중...');
      await axios.post(`${API_BASE}/Logout`, dataContent);
      setUpdateLogin(false);
      setDataContent(null);
    } catch (err) {
      console.log('로그아웃 오류:', err.message || err);
    } finally {
      if (finishLoading) finishLoading();
    }
  };

  return { upDateLogin, dataContent, logout };
};

export default useLoginStatus;
