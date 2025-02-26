import React , { useState, useEffect } from 'react';
import axios from 'axios';
import Page from '../../components/Page';
import Title from '../../components/Title';
import Navi from '../../components/Navi';
import NaviDB from '../../json/navi.json';
import selectDB from '../../json/select.json';
import FinanceInfo from '../../components/FinanceInfo';
import * as MyLayout from '../../lib/MyLayout';
import ErrorDialog from '../../components/ErrorDialog';

const Finance = () => {

    const [ upDateLogin , setUpdateLogin] = useState(false);
    const [ dataContent, setDataContent ] = useState();
    const [data, setData] = useState(false);
    const [href , setHref] = useState('');
    const { startLoading , finishLoading } = MyLayout.useLoading();
    const { openDialog } = MyLayout.useDialog();
    let arryContent01 = [];
    

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

    const onClick = async(value) => {

          const values = value;
          if(!data){
             setData(data);
             setHref('');
             console.log('fin', values)
          }
          if(values){
              try{
                    startLoading(`${values} 검색중...`);
                    console.log('fin', values);
                    const res = await axios.post('http://localhost:3400/financeApi', values);
                    const res_data = res.data.baseList;
                    console.log('financedata작동')

              if(res_data.length <= 0){
                  const title = res_data.kor_co_nm;
                  const prdtnm = res_data.fin_prdt_nm;
                  const start = res_data.dcls_strt_day;
                  const typenm = res.data.optionList.rsrv_type_nm;
                  arryContent01.push({title , prdtnm , typenm , start});
                  return finishLoading(), setData(arryContent01) , setHref(`/details/finance/${values}`);
              }

              if(res_data.length > 0){

                  for(let i in res_data){
                      const title = res_data[i].kor_co_nm;
                      const prdtnm = res_data[i].fin_prdt_nm;
                      const start = res_data[i].dcls_strt_day;
                      const typenm =res.data.optionList[i].rsrv_type_nm;
                      arryContent01.push({title , prdtnm , typenm , start});
                  }
                  return finishLoading(), setData(arryContent01) , setHref(`/details/finance/${values}`);
      
              }
                    } catch(err){
                      finishLoading();
                      arryContent01 = []; 
                      setData('검색결과가 없습니다');
                      return;
                }
                finally{ finishLoading();}
              }};

        const LogoutBtn = async() => {

          if(!upDateLogin){
            return
          }else{
              try{
                startLoading('로그아웃중...');
                const res = await axios.post('http://localhost:3400/Logout' , dataContent);
                const data = res.data;
                return finishLoading(), setUpdateLogin(false);
              }
              catch(err){
                finishLoading();
                console.log('err');
              }
              finally{ finishLoading();}
          }
        }

                useEffect(() => {
                  changeCondition();
                  onClick();
                },[data, upDateLogin])

    return(
     <Page header={<Title title={'금융'} backURL={'/'}/>}
     footer={ upDateLogin ? (<Navi loginUpload color onClick={LogoutBtn}/>) : (<Navi data={NaviDB.Info}></Navi>)}
     >
       <FinanceInfo
       id={'금융'}
       data={selectDB.bank}
       onChange={(e) => onClick(e.target.value)}
       dataName={data}
       name={href}
       >

       </FinanceInfo>
     </Page>
    )
}

export default Finance;