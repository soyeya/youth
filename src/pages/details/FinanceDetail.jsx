import React , { useState , useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page.jsx';
import Title from '../../components/Title.jsx';
import Navi from '../../components/Navi.jsx';
import naviDB from '../../json/navi.json';
import FinDetail from './FinDetail.jsx';
import ErrorDialog from '../../components/ErrorDialog.jsx';
import * as MyLayout from '../../lib/MyLayout.jsx';


const FinanceDetails = () => {

    const params = useParams();
    const [ upDateLogin , setUpdateLogin] = useState(false);
    const [ dataContent, setDataContent ] = useState();
    const [data , setData]= useState();
    const [moreData, setmoreData] = useState();
    const { startLoading, finishLoading } = MyLayout.useLoading();
    const { openDialog } = MyLayout.useDialog();
    const { values , name } = params;

    const arry01 = [];
    const result = [];


  const changeCondition = async() => {

    try{
       const res = await axios.get('http://localhost:3400/LoginList');
       const data = res.data;

       if(data.length <= 0){
         return setUpdateLogin(false);

       }else{
         return setUpdateLogin(true), setDataContent([data[0].userId, data[0].userPassword]);
       }

   } catch(err){
        openDialog(<ErrorDialog />);
        return;
   }
    
 };
  
    const Api = async() => {

       startLoading('정보불러오는 중...');
       try{
       const res = await axios.post('http://localhost:3400/financeApi' , name);
       const res_data = res.data.baseList;

       const answer = res_data.filter((list) => {
         return list.fin_prdt_nm == values;
       });
       
       const recur = result.concat(answer);
    
       if(recur[0].join_deny == 1) { recur[0].join_deny = "제한없음"}
       else if(recur[0].join_deny == 2) { recur[0].join_deny = "서민전용"}
       else if(recur[0].join_deny == 3) { recur[0].join_deny = "일부제한"};


       if( name == "전세자금대출" || name == "주택담보대출"){

        const prdtnm = recur[0].fin_prdt_nm;
        const etct = recur[0].loan_inci_expn;
        const member = recur[0].join_way ? recur[0].join_way : '없음';
        const deny = recur[0].join_deny ? recur[0].join_deny : '없음';
        const mtrt = recur[0].dly_rate;
        const banknm = recur[0].kor_co_nm;
        const start = recur[0].dcls_strt_day;
        const expire = recur[0].dcls_end_day;
        const erlyfee = recur[0].erly_rpay_fee;
        const loanlmt = recur[0].loan_lmt;
        const spcl = recur[0].spcl_cnd;
        arry01.push({ prdtnm, etct, member, deny, mtrt , banknm, start , expire , erlyfee , loanlmt, spcl});
        return finishLoading(), setmoreData(true), setData(arry01);

       }else if ( name == "개인신용대출"){

        const prdtnm = recur[0].fin_prdt_nm;
        const etct = `CB회사명 ${recur[0].cb_name}`;
        const member = recur[0].join_way ? recur[0].join_way : '없음';
        const deny = recur[0].join_deny ? recur[0].join_deny : '없음';
        const mtrt = recur[0].dly_rate;
        const banknm = recur[0].kor_co_nm;
        const start = recur[0].dcls_strt_day;
        const expire = recur[0].dcls_end_day;
        const erlyfee = recur[0].erly_rpay_fee;
        const loanlmt = recur[0].loan_lmt;
        const spcl = recur[0].spcl_cnd;
        arry01.push({ prdtnm, etct, member, deny, mtrt , banknm, start , expire , erlyfee , loanlmt, spcl});
        return finishLoading(), setmoreData(false), setData(arry01);

       }else if( name == "연금저축"){

        const prdtnm = recur[0].fin_prdt_nm
        const etct = `연금종류명:${recur[0].pnsn_kind_nm} 상품유형명:${recur[0].prdt_type_nm}`;
        const member = recur[0].join_way ? recur[0].join_way : '없음';
        const deny = recur[0].join_deny ? recur[0].join_deny : '없음';
        const mtrt = recur[0].dly_rate;
        const banknm = recur[0].kor_co_nm;
        const start = recur[0].dcls_strt_day;
        const expire = recur[0].dcls_end_day;
        const erlyfee = recur[0].erly_rpay_fee;
        const loanlmt = recur[0].loan_lmt;
        const spcl = `판매사 : ${recur[0].sale_co}`;
        arry01.push({ prdtnm, etct, member, deny, mtrt , banknm, start , expire , erlyfee , loanlmt , spcl});
        return finishLoading(), setmoreData(false), setData(arry01);

       }

      else if(name == "정기예금" || name == "적금") {
       const prdtnm = recur[0].fin_prdt_nm;
       const etct = recur[0].etc_note;
       const member = recur[0].join_member;
       const deny = recur[0].join_deny;
       const mtrt = recur[0].mtrt_int;
       const banknm = recur[0].kor_co_nm;
       const start = recur[0].dcls_strt_day;
       const expire = recur[0].dcls_end_day;
       const spcl = recur[0].spcl_cnd;
       arry01.push({ prdtnm, etct, member, deny, mtrt , banknm, start, expire , spcl});
      return finishLoading(), setmoreData(false), setData(arry01)

      }
    
       }catch(err){
        finishLoading();
        openDialog(<ErrorDialog />);
        return;
       }
      finally{ finishLoading();}
    };

    const onClick = async(e) => {

      const value = params.values;
      const name = params.name;
      const link = `/details/finance/${name}/${value}`;
      const letter = e;
 
      if(upDateLogin){
 
        try{
        const res = await axios.post('http://localhost:3400/MyList' , [dataContent[0], name, link, value]);
        const data = res.data;
 
        if(data == 'already'){
          return alert('이미 찜한 상품입니다');
        }else{
          letter.style.color = `#f00000`;
 
          return alert('찜에 성공했습니다.');
        }
       }catch(err){
        openDialog(<ErrorDialog />);
        return;
       }
 
      }else{
 
          return alert('로그인 이후 이용가능합니다');
      }
      
   };
  
    useEffect(() => {
   
        changeCondition();
        Api();
  
    },[])
  
       return(
          <Page header={<Title title={'금융정보설명'}></Title>}
          footer={ upDateLogin ? (<Navi data={naviDB.Info}/>) : (<Navi data={naviDB.detail}/>)}>
        
            <FinDetail
            data={data}
            title={values}
            moreData={moreData}
            onClick={(e) => onClick(e.target)}
            >
              
            </FinDetail>
            
          </Page>
       )
}

export default FinanceDetails;