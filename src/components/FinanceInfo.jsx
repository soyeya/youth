import React , { useState, useEffect } from 'react';
import { useNavigate  } from 'react-router-dom';

const FinanceInfo = ({ id, onChange, data, dataName , name}) => {

    const [listup, setListup] = useState(false);
    const list = { dataList : dataName };
    const navigate = useNavigate();

    const onClick = (e) => {

        const values = e.textContent;
        console.log(values, 'target')
        navigate(`${name}/${values}`);
         
     }

    useEffect(() => { 
       
          if(!dataName){ return } 
          setListup(true)
          

    },[dataName])

     return (

         <div className="financeInfo">
              <div className="formBox">
                    <form id="myForm">
                        <select form="myForm" id={id} onChange={onChange} name={id}>
                            {data.map((v,i) => (
                            <option key={id + i} value={v.name}>{v.name}</option>
                            ))}
                        </select>
                    </form>
                </div>
                <div className="list">
                        <div className="listBox">
                            <ul>
                                <li className='list_title'><p>금융상품</p></li>
                                {listup && (list.dataList.map((v,i) => (
                                       <li key={'list' + i}>
                                             <span>{v.title}<p onClick={(e) => onClick(e.target)}>{v.prdtnm}</p><p className="finDate" style={{"color" : "#000"}}>{v.typenm}</p><p className="finDate">{v.start}</p></span>
                                           </li>
                                    )))
                               }
                            </ul>
                        </div>
                    </div>
         </div>
     )

}

export default FinanceInfo;