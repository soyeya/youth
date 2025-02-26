import React , {useState , useEffect} from 'react';
import { useNavigate } from 'react-router-dom';

const Info = ({id, name, list01, list02}) => {
    
    const [open , setOpen] = useState();
     const navigate = useNavigate();
     const list = {
          dataList : list01,
          dataContent : list02,
     }
     
     const setChange = () => {
      
     if(list01 == true) return
     else{ setOpen(true); }}

     const onClick = (e) => {

        const values = e.textContent;
        navigate(`${name}/${values}`)
         
     }

     useEffect(()=>{
        setChange();

     },[])


     return(
        <div className="info">
                <div className="formBox">
                    {/* <form id="myForm">
                        <select form="myForm" id={id} onChange={onChange} name={id}>
                            {data.map((v,i) => {
                            return ( <option key={id + i} value={v.name}>{v.name}</option>
                            ) })}
                        </select>
                    </form> */}
                </div>
                    <div className="list">
                        <div className="listBox">
                            <ul>
                                <li className='list_title'><p>{id} 정책명</p></li>
                                {open && list.dataContent ? (list.dataContent.map((v,i) => {
                                      return (<li key={'list' + i}>
                                             <span onClick={(e) => onClick(e.target)}>{list.dataList[i]}</span><p>{[v]}</p>
                                           </li>
                                )})):""
                               }
                            </ul>
                        </div>
                    </div>
        </div>
     )
}

export default Info;