import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Navi 컴포넌트
 *
 * Props:
 *  - data        : navi.json 배열 → 링크 목록을 그대로 렌더링
 *  - loginUpload : 로그인 후 리스트·마이페이지용 → 마이페이지 + 로그아웃
 *  - loginDetail : 로그인 후 상세 페이지용     → 마이페이지 + 홈 + 로그아웃
 *  - Mylist      : 찜목록 페이지용             → 홈 + 로그아웃
 *  - onClick     : 로그아웃 핸들러
 *  - color       : 배경색 클래스 추가 여부
 */
const Navi = ({ data, color, loginUpload, loginDetail, Mylist, onClick }) => {
  const cls = color ? 'nav color' : 'nav';

  if (loginDetail) {
    return (
      <div className={cls}>
        <ul>
          <li><Link to='/mypage'>마이페이지</Link></li>
          <li><Link to='/'>홈</Link></li>
          <li onClick={onClick} style={{ cursor: 'pointer' }}>로그아웃</li>
        </ul>
      </div>
    );
  }

  if (loginUpload) {
    return (
      <div className={cls}>
        <ul>
          <li><Link to='/mypage'>마이페이지</Link></li>
          <li onClick={onClick} style={{ cursor: 'pointer' }}>로그아웃</li>
        </ul>
      </div>
    );
  }

  if (Mylist) {
    return (
      <div className={cls}>
        <ul>
          <li><Link to='/'>홈</Link></li>
          <li onClick={onClick} style={{ cursor: 'pointer' }}>로그아웃</li>
        </ul>
      </div>
    );
  }

  return (
    <div className={cls}>
      <ul>
        {(data || []).map((v, i) => (
          <li key={'link' + i}><Link to={`${v.href}`}>{v.title}</Link></li>
        ))}
      </ul>
    </div>
  );
};

export default Navi;
