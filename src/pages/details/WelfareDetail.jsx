import React , { useState , useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page.jsx';
import Title from '../../components/Title.jsx';
import Navi from '../../components/Navi.jsx';
import naviDB from '../../json/navi.json';
import Detail from '../../components/Detail';
import ErrorDialog from '../../components/ErrorDialog.jsx';
import * as MyLayout from '../../lib/MyLayout.jsx';


const WelfareDetails = () => {

    const params = useParams();
    const [ upDateLogin , setUpdateLogin] = useState(false);
    const [ dataContent, setDataContent ] = useState();
    const [ info , setInfo ] = useState();
    const [ expire , setExpire ] = useState();
    const [ administration , setAdministration ] = useState();
    const [ address , setAddress ] = useState();
    const [ etct, setEtct ] = useState();
    const { startLoading, finishLoading } = MyLayout.useLoading();
    const { openDialog } = MyLayout.useDialog();
    const { values } = params;
    let arry01 = { 
      title : [], 
      content : [], 
      expire :[], 
      administration : [], 
      address : [] , 
      etct : []};
  

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
       const res = await axios.get('http://localhost:3400/welfareApi');
       const data = res.data.youthPolicyList; 
  
       if(!data.length){ //데이터가 하나라면
       if(data.plcyNm === values){
        const data_title = data.plcyNm; //정책명
        const data_content = data.plcyExplnCn; //정책소개
        const data_expire = data.bizPrdEndYmd; //기간
        const data_administration = data.sprvsnInstCdNm; //주관
        const data_address = data.aplyUrlAddr ? data.aplyUrlAddr : data.refUrlAddr1//url주소
        const data_etct = data.plcySprtCn != null ? data.plcySprtCn : '없음'; //기타사항
     
       arry01.title.push(data_title);
       arry01.content.push(data_content);
       arry01.expire.push(data_expire);
       arry01.administration.push(data_administration);
       arry01.address.push(data_address);
       arry01.etct.push(data_etct);
   
       return finishLoading(), 
          setInfo(arry01.content[0]),
          setExpire(arry01.expire[0]),
          setAdministration(arry01.administration[0]),
          setAddress(arry01.address[0]),
          setEtct(arry01.etct[0]);
       }
  
       }
  
      if(data.length > 0){
  
       for(let i = 0; i < data.length; i++){
        if(data[i].plcyNm === values){
          const data_title = data[i].plcyNm; //정책명
          const data_content = data[i].plcyExplnCn; //정책소개
          const data_expire = data[i].bizPrdEndYmd; //기간
          const data_administration = data[i].sprvsnInstCdNm; //주관
          const data_address = data[i].aplyUrlAddr ? data[i].aplyUrlAddr : data[i].refUrlAddr1//url주소
          const data_etct = data[i].plcySprtCn != null ? data[i].plcySprtCn : '없음'; //기타사항
        
          arry01.title.push(data_title);
          arry01.content.push(data_content);
          arry01.expire.push(data_expire);
          arry01.administration.push(data_administration);
          arry01.address.push(data_address);
          arry01.etct.push(data_etct);
  
            return finishLoading(), 
            setInfo(arry01.content[0]),
            setExpire(arry01.expire[0]),
            setAdministration(arry01.administration[0]),
            setAddress(arry01.address[0]),
            setEtct(arry01.etct[0]);
        }
        }
      }
  
       }catch(err){
        finishLoading();
        openDialog(<ErrorDialog />);
        return;
       }
       finishLoading();
    };

    const onClick = async(e) => {

      const value = params.values;
      const name = '없음';
      const link = `/details/welfare/${value}`;
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
  
    },[upDateLogin])
  
       return(
          <Page header={<Title title={'복지정책설명'}></Title>}
          footer={<Navi data={naviDB.Info}/>}>
        
            <Detail 
            title={ values }
            info={info}
            expire={expire}
            administration={administration}
            etct={etct}
            address={address}
            onClick={(e) => onClick(e.target)}
            >
              
            </Detail>
            
          </Page>
       )
}

export default WelfareDetails;