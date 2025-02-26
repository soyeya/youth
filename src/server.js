const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3400;
const server = require('http').createServer(app);
const { database } = require('./api/board.js');
const { dataTable } = require('./lib/db.js');


app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
     res.json("hello this is backend")
})

/* newsApi */
app.get("/newsApi", async(req, res, ctx) => {

  const orderList = await database.news_api();
  try{
    if(orderList){
      console.log(orderList, 'news_api_server')
      return res.status(200).send(orderList);
    }
    }catch(err){
      console.log('newsApiserver', err)
      res.status(500).send(`${err} : newsApiserver_ internal server error`) //status(500) - 서버 내부 오류(Internal Server Error)를 나타내는 HTTP 상태 코드 -> 클라이언트의 요청은 올바르게 전달되었으나 서버에서 문제를 처리하는 과정에 오류발생 / 서버측의 문제
      //ex. 데이터베이스 오류, 서버설정오류, 코드예외발생, 서버리소스부족문제
      //status(400)의 경우? - 잘못된 요청을 나타내는 http상태코드 - 클라이언트가 서버에 보낸 요청이 유효하지않음
      //ex. 클라이언트가 필수데이터 빠뜨리고 요청 보냈을 때, 요청본문을 잘못된 형식으로 보냈을때(json형식..)
      //잘못된 url, 파라미터를 보냈을 때, 인증 정보가 잘못된 경우(잘못된 토큰, 비밀번호) -> 클라이언트측에서 잘못된 데이터를 보내거나 필요한 필드를 빠뜨리거나, 형식이 맞지 않는 요청을 보낼 때 발생
    }

   })

app.post("/jobApi", async({req, res, ctx}) => {
       
   const orderList = await database.job_api(req.body);
   res.send(orderList);
  })

app.get("/residenceApi", async({req, res, ctx}) => {
       
    const orderList = await database.residence_api();
    try{
       if(orderList){
         console.log(orderList, 'residenceApi server');
         return res.status(200).send(orderList);
       }
    }catch(err){
       console.log('residenceServer', err)
       res.status(500).send(`${err} : residenceServer_ internal server error`)
    }
   })

app.get("/welfareApi", async({req, res, ctx}) => {
    const orderList = await database.welfare_api();
    try{
      if(orderList){
        console.log(orderList, 'welfareApi server ');
        res.status(200).send(orderList)
      }
    }catch(err){
      console.log('welfareServer', err)
      res.status(500).send(`${err} : welfareServer_ internal server error`)
    }
   })
app.get("/educationApi", async({req, res, ctx}) => {
       
    const orderList = await database.education_api();
    try{
      if(orderList){
      console.log(orderList, 'educationApi server')
      res.status(200).send(orderList);
      }
    }catch(err){
       console.log('educationServer', err)
       res.status(500).send(`${err} : educationServer_ internal server error`)
    }
   
   })
app.post("/financeApi", async(req, res, ctx) => {
       
    const orderList = await database.finance_api(req.body);
    res.send(orderList);
    
   })

app.post("/join" , async(req, res) => {
    
     const value = req.body;
     const sqlQuery = `INSERT INTO Login (userId, userPassword) VALUES('${value.userId}','${value.userPassword}');`;
     const promisePool = dataTable.db.promise();
     try{
         const res_data = await promisePool.query(sqlQuery);
         res.send(res_data[0]);

    }catch(err){
       res.send(err);
    }

})

app.post("/MyList" , async(req, res) => {
    
  const value = req.body;
  const sqlQuery = `SELECT * FROM MyList`;
  const promisePool = dataTable.db.promise();
  try{
      const res_data = await promisePool.query(sqlQuery);

      if(res_data[0].length >= 0){
        const ListUpdate = `INSERT INTO MyList (userId, section, link , title) VALUES('${value[0]}', '${value[1]}','${value[2]}', '${value[3]}');`;
        const answer = res_data[0].map((v,i) => {
          const result = res_data[0][i].userId == value[0] && res_data[0][i].title == value[3];
          return result;
        })
        if(answer.includes(true)){
           return res.send('already');
        }else{
          const upload = await promisePool.query(ListUpdate);
          upload;
          return res.send('업로드성공');
         }
      }

 }catch(err){
    res.send(err);
 }

});

app.get("/MyList" , async(req, res) => {

  const sqlQuery = `SELECT * FROM MyList`;
  const promisePool = dataTable.db.promise();
  try{
    const res_data = await promisePool.query(sqlQuery);

      res.send(res_data[0]);

  }catch(err){
    res.send(err);
  }
  
})

app.post("/login" , async(req, res) => {
    
  console.log(req.body);
  const sqlQuery = `SELECT * FROM Login`;
  const promisePool = dataTable.db.promise();
  try{
    const res_data = await promisePool.query(sqlQuery);

    if(res_data[0][0].userId == req.body[0] && res_data[0][0].userPassword == req.body[1]){
      const ListUpdate = `INSERT INTO LoginList( userId, userPassword)  VALUES('${req.body[0]}' , '${req.body[1]}')`;
      const List_data = await promisePool.query(ListUpdate);
      List_data;
    
    }else{}

    return res.send(res_data[0]);

    }catch(err){
      console.log(err);
    }

})


app.get("/LoginList" , async(req, res) => {
    
  const sqlQuery = `SELECT * FROM LoginList`;
  const promisePool = dataTable.db.promise();

  try{
    const res_data = await promisePool.query(sqlQuery);
    res.send(res_data[0]);

    }catch(err){
      console.log(err);
    }

})

app.post("/Logout" , async(req, res) => {
    
  console.log(req.body);
  const sqlQuery01 = `DELETE FROM LoginList WHERE userId LIKE '${req.body[0]}';`;
  const sqlQuery02 = `DELETE FROM LoginList WHERE userPassword LIKE '${req.body[1]}';`;
  const promisePool = dataTable.db.promise();
  try{
    const res_data = await promisePool.query(sqlQuery01, sqlQuery02);
    res.send(res_data);
    }catch(err){
      console.log(err);
    }

})
 

server.listen(PORT, ()=>{
    console.log(`${PORT}로 작동중`);
  })

