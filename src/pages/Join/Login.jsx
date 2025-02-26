import React , { useState , useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page';
import Title from '../../components/Title';
import Navi from '../../components/Navi';
import naviDB from '../../json/navi.json';
import Formcontrol from '../../components/Formcontrol.jsx';
import * as MyForm from  '../../lib/MyForm.jsx';
import * as MyLayout from '../../lib/MyLayout.jsx';
import ErrorDialog from '../../components/ErrorDialog.jsx';


const Login = () => {

     const [ login , setLogin ] = useState();
     const navigate = useNavigate();
     const { startLoading , finishLoading } = MyLayout.useLoading();
     const { openDialog } = MyLayout.useDialog();

     const validate = (values) => {
       
      const errors = {};
      const idRegExp = /^[a-z]+[a-z0-9]{5,19}$/g;
      const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;

       if (!values.login_id || !idRegExp.test(values.login_id)) {
         errors.login_id = "아이디를 입력해주세요";
       }
       if (!values.login_password || !passwordRegExp.test(values.login_password)) {
         errors.login_password = "비밀번호를 입력해주세요";
       }
       return errors;

     };


      const onClick = async(e) => {

       const login_list = [];

        if(!login) return;
          else{
          const idRegExp = /^[a-z]+[a-z0-9]{5,19}$/g;
          const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;
          const value_id = e.parentElement.children.login_form.login_id.value;
          const value_password = e.parentElement.children.login_form.login_password.value;

          if(!idRegExp.test(value_id) || !passwordRegExp.test(value_password)){
            
            return alert(`아이디와 비밀번호를 다시 입력해주세요`);
          
          }else{

        try{
            startLoading('로그인 시도중...');
            login_list.push({ userId : value_id , userPassword : value_password});
            const res = await axios.post('http://localhost:3400/login' , [login_list[0].userId, login_list[0].userPassword]);
            const data = res.data;

            if(data <= 0){
              
              const Login_data = [];
              Login_data.push({ Id : data.userId, Password : data.userPassword });
              const id_result = Login_data[0].Id.match(login_list[0].userId) == Login_data[0].Id;
              const password_result = Login_data[0].Password.match(login_list[0].userPassword) == Login_data[0].Password;

            if(id_result && password_result){
                return finishLoading(), navigate(`/`);
                 
            }
            }

            if(data.length > 0){

              for(let i in data){

                const Login_data = [];
                Login_data.push({ Id : data[i].userId, Password : data[i].userPassword });
                const id_result = Login_data[0].Id.match(login_list[0].userId) == Login_data[0].Id;
                const password_result = Login_data[0].Password.match(login_list[0].userPassword) == Login_data[0].Password;

                if(id_result && password_result){
                  return finishLoading(), navigate(`/`);
                }
              
              }

              return finishLoading(), alert('아이디와 비밀번호가 없습니다');
            
             }

            }catch(err){
              finishLoading();
              openDialog(<ErrorDialog />);
              return;

            
            }
            finishLoading();
          }

          }
      
      }
    

      useEffect(() => {

         setLogin(true);

      },[])

     return(
      <Page
      header={<Title title={'로그인'}/>}
      footer={<Navi data={naviDB.join}/>}>
        { login && (
        <div className="join login">
           <div className="joinBox">
             <h3>아이디 및 비밀번호를 입력해주세요</h3>
          <MyForm.Form
            id="login_form"
            className="LoginForm"
            initialValue={{
                login_id : "",
                login_password : ""
            }}
            validate={validate}
            // onSubmit={onClick}

          >
            <Formcontrol
            label={'아이디'}
            htmlFor='login_id'
            required
            error={<MyForm.ErrorMessage name='login_id'/>}
            >
            <MyForm.FormField 
             type="text"
             placeholder="아이디를 입력해주세요"
             name="login_id"
            />
            </Formcontrol>
            <Formcontrol
             label={'비밀번호'}
             required
             htmlFor='login_password'
             error={<MyForm.ErrorMessage name='login_password' />}
            >
            <MyForm.FormField 
             type="password"
             placeholder="비밀번호를 입력해주세요"
             name="login_password"
            />
            </Formcontrol>
          </MyForm.Form>
            <button className='submitBtn' onClick={(e) => onClick(e.target)}>로그인</button>
            </div>
        </div> )}
        </Page>
     )

}

export default Login;