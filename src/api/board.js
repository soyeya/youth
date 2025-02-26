const axios = require('axios');
const convert = require('xml-js');
const selectDB = require('../json/select.json');

const news_api = async() => {

    const key = `72f9eab5-8f90-4619-86a9-2eab24acc61d`;
    const job = `001`//bscPlanPlcyWayNo - 기본계획정책방향번호 -> 001 일자리 
    const size = `80`;
     try{
        const res = await axios.get((`https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${key}&pageSize=${size}`));
        const data = res.data.result;
        console.log(data);
        return data;
     }
    catch(error){
        return console.log('boardJs newsApi Err', err)
     }

}


    const job_api = async(values) => {

    const key = `5955966ac3d2620c621d1718`;
    const work = `023010`; 
    const value = Object.keys(values);

     try{
        for(let v of selectDB.region){
            if(value == v.name){
                const res = await axios.get(encodeURI(`https://www.youthcenter.go.kr/opi/youthPlcyList.do?openApiVlak=${key}&pageIndex=1&display=10&srchPolyBizSecd=${v.code}&bizTycdSel=${work}`));
                const data = convert.xml2json(res.data,{
                    compact: true, // Compact JSON으로 받기
                    spaces: 4, // XML 결과물 들여쓰기에 사용할 공백 수
                });
                return data;
        }else { return '검색결과없음'}
     }
    }
    catch(error){
        return error;
     }

}

const residence_api = async() => {

    const key = `72f9eab5-8f90-4619-86a9-2eab24acc61d`;
    const residence = `002`; //bscPlanPlcyWayNo - 기본계획정책방향번호 -> 002 주거
    const size = `80`;

     try{
        const res = await axios.get((`https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${key}&pageSize=${size}`));
        const data = res.data.result; //data결과
        console.log(data, 'residence api')
        return data;
    }
    catch(error){
        return console.log('boardJs residenceApi data Err' , err)
     }

}

const welfare_api = async() => {

    const key = `72f9eab5-8f90-4619-86a9-2eab24acc61d`;
    const welfare = `004`; //bscPlanPlcyWayNo - 기본계획정책방향번호 -> 004 복지
    const size = `80`;

    try{
        const res = await axios.get((`https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${key}&pageSize=${size}`));
        const data = res.data.result; //data결과
        console.log(data, 'welfare api')
        return data;
    }
    catch(error){
        return console.log('boardJs welfareApi data Err' , err)
     }

}


const education_api = async() => {

    const key = `72f9eab5-8f90-4619-86a9-2eab24acc61d`;
    const education = `003`; //bscPlanPlcyWayNo - 기본계획정책방향번호 -> 003 교육
    const size = `80`;

    try{
        const res = await axios.get((`https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${key}&pageSize=${size}`));
        const data = res.data.result; //data결과
        console.log(data, 'education api')
        return data;
    }
    catch(error){
        return console.log('boardJs educationApi data Err' , err)
     }


}

const finance_api = async(values) => {

      const key = `916c5dc9c4437bedd9264a7b767aab71`;
      const value = Object.keys(values);

      try{
        for(let v of selectDB.bank){
            if(value == v.name){
                console.log(value);
                const res = await axios.get(`http://finlife.fss.or.kr/finlifeapi/${v.code}.json?auth=${key}&topFinGrpNo=${v.section}&pageNo=1`);
                const data = res.data.result;
              
                return data;
            }
        }
      }catch(error){
        return error;
      }
      
}

const database = {
   
    news_api,
    job_api,
    residence_api,
    welfare_api,
    education_api,
    finance_api
}

module.exports = { database }






