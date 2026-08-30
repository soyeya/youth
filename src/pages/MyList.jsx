import React from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page.jsx';
import Title from '../components/Title.jsx';
import Navi from '../components/Navi.jsx';
import NaviDB from '../json/navi.json';
import WishlistPanel from '../components/WishlistPanel';
import useLoginStatus from '../utils/useLoginStatus';

const MyList = () => {
  const navigate = useNavigate();
  const { upDateLogin, dataContent, logout } = useLoginStatus();

  const userId = upDateLogin ? dataContent?.[0] : null;

  const handleLogout = async () => { await logout(); };

  /* 미로그인 */
  if (!upDateLogin) {
    return (
      <Page header={<Title title={'찜목록'} />} footer={<Navi data={NaviDB.home} />}>
        <div className="mylist-wrap">
          <div className="mylist-login-notice">
            <p className="mylist-login-title">로그인 후 이용 가능합니다</p>
            <button className="mylist-login-btn" onClick={() => navigate('/login')}>
              로그인 하러 가기
            </button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      header={<Title title={'찜목록'} />}
      footer={<Navi Mylist color onClick={handleLogout} />}
    >
      <div className="mylist-wrap">
        <WishlistPanel userId={userId} />
      </div>
    </Page>
  );
};

export default MyList;
