import React from 'react';

const Detail = ({ title , info , administration, expire , address, etct , onClick}) => {
     return(
      <div className="detail">
         <h3>{title}</h3>
         <ul className='detail_cont'>
            <li><strong>정책소개</strong><p>{info}</p></li>
            <li><strong>기타사항</strong><p>{etct}</p></li>
            <li><strong>신청사이트 주소</strong><p>{address}</p></li>
         </ul>
         <ul>
            <li><strong>주관</strong>{administration}</li>
            <li><strong>기간</strong>{expire}</li>
            <li onClick={onClick}>찜하기</li>
         </ul>
      </div>

     )
}

export default Detail;