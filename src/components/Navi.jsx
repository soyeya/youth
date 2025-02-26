import React from 'react';
import { Link } from 'react-router-dom';

const Navi = ( { data , color, loginUpload , Mylist, onClick  }) => {
     if( loginUpload ){
      return(
         <div className={color ? "nav color" : "nav"}>
             <ul>
                <li><Link to='/myList'>찜목록</Link></li>
                <li onClick={onClick} style={{cursor : "pointer"}}>로그아웃</li>
             </ul>
         </div>
      )}else if( Mylist ){
        return(
            <div className={color ? "nav color" : "nav"}>
                <ul>
                   <li><Link to='/'>홈</Link></li>
                   <li onClick={onClick} style={{cursor : "pointer"}}>로그아웃</li>
                </ul>
            </div>
         )
     }else{
     return(
        <div className={color ? "nav color" : "nav"}>
            <ul>
              {data.map((v,i) => (
                <li key={'link'+i}><Link to={`${v.href}`}>{v.title}</Link></li>
                ))}
            </ul>
        </div>
     )
 }
}

export default Navi;