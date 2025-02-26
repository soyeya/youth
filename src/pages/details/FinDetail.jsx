import React , { useState , useEffect } from 'react';

const FinDetail = ({ title , data , moreData , onClick}) => {
    
     const [ open, setOpen ] = useState();
     const list = {
         dataList : data
     }
     useEffect(() => {

         if(!data){}
         else setOpen(true)
       
     },[list.dataList])

     return(
      <div className="detail">
         <h3>{title}</h3>
         { open && (<>
           <ul className='detail_cont'>
            <li><strong>상품명</strong><p>{list.dataList[0].prdtnm}</p></li>
            <li><strong>가입대상</strong><p>{list.dataList[0].member}</p></li>
            <li><strong>가입제한</strong><p>{list.dataList[0].deny}</p></li>
            <li><strong>우대조건</strong><p>{list.dataList[0].spcl}</p></li>
            <li><strong>기타사항</strong><p>{list.dataList[0].etct}</p></li>
            <li><strong>이자율</strong><p>{list.dataList[0].mtrt}</p></li>
            { moreData && (
               <>
            <li><strong>중도상환수수료</strong><p>{list.dataList[0].erlyfee}</p></li>
            <li><strong>한도</strong><p>{list.dataList[0].loanlmt}</p></li> 
            </>)}
         </ul>
         <ul>
            <li><strong>주관은행</strong>{list.dataList[0].banknm}</li>
            <li><strong>공시시작일</strong>{list.dataList[0].start}</li>
            <li><strong>공시만기일</strong>{list.dataList[0].end}</li>
            <li onClick={onClick}>찜하기</li>
         </ul> </> )}
      </div>

     )
}

export default FinDetail;