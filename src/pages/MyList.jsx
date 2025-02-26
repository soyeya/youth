import React , { useState, useEffect }from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Page from '../components/Page.jsx';
import Title from '../components/Title.jsx';
import Navi from '../components/Navi.jsx';
import NaviDB from '../json/navi.json';

const MyList = () => {
    const [ upDateLogin , setUpdateLogin] = useState(false);
    const [ dataContent, setDataContent ] = useState();
    const [ myListup , setmyListup ] = useState(false);


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
   
          console.log(err);
       }
        
     }

     const LogoutBtn = async() => {
        if(!upDateLogin){
            return
          }else{
              try{
                const res = await axios.post('http://localhost:3400/Logout' , dataContent);
                const data = res.data;
                setUpdateLogin(false);
              }
              catch(err){
                console.log('err');
              }
          
          }
     }

    const ListUpLoad = async() => {
       
      const ListUp = [];
      if(!upDateLogin){ return }
      else{
        try{
         const res = await axios.get('http://localhost:3400/MyList');
         const data = res.data;
        
         if(data.length > 0){
           for(let i = 0; i < data.length; i++){
             const title = data[i].title;
             const link = data[i].link;
             const administration = data[i].section;
             ListUp.push({title : title, link : link, administration : administration});
           }
           return setmyListup(ListUp);
         }
         console.log('mylist', myListup);

      }catch(err){
        console.log(err);
      }
     } 
    }

     useEffect(() => {

        changeCondition();
        ListUpLoad();

     },[upDateLogin])


     if(upDateLogin){
     return(

      <Page header={ <Title title={'찜목록'}></Title>}
       footer={ upDateLogin ? (<Navi Mylist color onClick={LogoutBtn}/>) : (<Navi data={NaviDB.join}></Navi>)}
      >
        <div className="Mylist">
             <ul>
                <h3>{dataContent && dataContent[0]}님의 찜목록입니다</h3>
                { myListup && <>
                { myListup.map((v,i)=> (
                  <li key={'myList' + i}><Link to={v.link}><span>{v.title}</span><p>{v.administration}</p></Link></li>
                ))}
                </>
                }
             </ul>
        </div>
      </Page>

     )}
     else{
        return(
            <Page header={ <Title title={'찜목록'}></Title>}
             footer={<Navi data={NaviDB.join}></Navi>}
            >
              <div className="Mylist">
                   <ul>
                      <h3>로그인후 이용가능합니다.</h3>
                   </ul>
              </div>
            </Page>
      
           )
     }
}

export default MyList;
