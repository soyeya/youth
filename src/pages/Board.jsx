import React , {  useEffect } from 'react';
import { Link } from 'react-router-dom';


const Board = ({ boardList }) => {

     useEffect(() => {

     },[boardList])

     return (

         <div className="board">
            <h3><span>News</span>다양한 유스에게의 소식을 확인하세요</h3>
            <ul>
                { boardList &&  <>               
                {boardList.map((v,i) => (
                    <li key={'board' + i}><Link to={`/details/job/${v.title}`}><p>{v.title}</p><span>{v.administration}</span></Link></li>
                ))}</>

                  } 
            </ul>
         </div>
     )
}

export default Board;
