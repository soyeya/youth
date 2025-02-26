import React , { useState, useEffect } from 'react';
import axios from 'axios';
import Info from '../../components/Info';
import Page from '../../components/Page';
import Title from '../../components/Title';
import Navi from '../../components/Navi';
import NaviDB from '../../json/navi.json';
import selectDB from '../../json/select.json';
import * as MyLayout from '../../lib/MyLayout';
import ErrorDialog from '../../components/ErrorDialog';

const Eductaion = () => {

    const [ upDateLogin , setUpdateLogin] = useState(false);
    const [ dataContent, setDataContent ] = useState();
    const [data, setData] = useState(false);
    const [content, setContent] = useState(false);
    const [href , setHref] = useState('');
    const { startLoading , finishLoading } = MyLayout.useLoading();
    const { openDialog } = MyLayout.useDialog();
    let arryContent01 = [];
    let arryContent02 = [];
    
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

    const onClick = async() => {
          if(!data){
              startLoading(`교육관련 불러오는 중...`)
              try{
                    const res = await axios.get('http://localhost:3400/educationApi');
                    const res_data = res.data.youthPolicyList;
                    if(!res_data.length){ //한개인 경우
                      if(res_data[i].bscPlanPlcyWayNo === '003'){ //003 교육정책이라면
                      const result01 = [res_data.plcyNm]; //정책명
                      const result02 = [res_data.plcySprtCn];//정책내용
                      arryContent01.push(result01);
                      arryContent02.push(result02);
                      return finishLoading(), setData(arryContent01), setContent(arryContent02), setHref(`/details/education`);
                      }
                    }

                    if(res_data.length > 0){
                      for(let i = 0; i < res_data.length; i++){
                        if(res_data[i].bscPlanPlcyWayNo === '003'){ //003 교육정책이라면
                          const result01 = [res_data[i].plcyNm]; //정책명
                          const result02 = [res_data[i].plcySprtCn];//정책내용
                          arryContent01.push(result01);
                          arryContent02.push(result02);
                        }
                      }
                      return finishLoading(), setData(arryContent01), setContent(arryContent02), setHref(`/details/education`);
                    }
                          } catch(err){
                            finishLoading();
                            arryContent01 = [];
                            arryContent02 = ['검색결과가 없습니다'];
                            setData(arryContent01);
                            setContent(arryContent02);
                            setHref('');
                            console.log('eductaion api err', err)
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
                finally{finishLoading();}
            
            }
          }
  
            useEffect(() => {
              changeCondition();
              onClick();
            },[data, content, upDateLogin])

    return(
     <Page header={<Title title={'교육'} backURL={'/'}/>}
     footer={ upDateLogin ? (<Navi loginUpload color onClick={LogoutBtn}/>) : (<Navi data={NaviDB.Info}></Navi>)}
     >
        <Info 
        id={'교육'} 
        // data={selectDB.region} 
        // onChange={(e) => onClick(e.target.value)}
        list01={data}
        list02={content}
        name={href}
        />
     </Page>
    )
}

export default Eductaion;