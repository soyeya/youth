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

const Join = () => {

     const [ join , setJoin ] = useState();
     const [ sucess , setSucess ] = useState();
     const { startLoading , finishLoading } = MyLayout.useLoading();
     const { openDialog } = MyLayout.useDialog();
     const navigate = useNavigate();
    
     const validate = (values) => {
       
       const errors = {};
       const idRegExp = /^[a-z]+[a-z0-9]{5,19}$/g;
       const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;

        if (!idRegExp.test(values.join_id)) {
          errors.join_id = "아이디를 영문자 또는 숫자 6~20자로 입력해주세요";
        }
        if (!passwordRegExp.test(values.join_password)) {
          errors.join_password = "비밀번호를 8 ~ 16자 영문, 숫자 조합해주세요";
        }
        return errors;

      };

      const onClick = async(e) => {

       if(!join) return {};

       else{

        const login_list = { userId : [], userPassword : []};
        const idRegExp = /^[a-z]+[a-z0-9]{5,19}$/g;
        const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;
        const value_id = e.parentElement.children.join_form.join_id.value;
        const value_password = e.parentElement.children.join_form.join_password.value;

        if(!idRegExp.test(value_id) || !passwordRegExp.test(value_password)){
          
          return navigate('/join'), alert(`아이디와 비밀번호 조건이 맞지않습니다`);
        
        }else{

         try{
            startLoading('회원가입중...');
            login_list.userId.push(value_id);
            login_list.userPassword.push(value_password);
            const res = await axios.post('http://localhost:3400/join' , login_list);
            const data = res.data;
            setSucess(data);
            return finishLoading(), alert(`${value_id} 환영합니다.`), navigate('/');

            }catch(err){
              finishLoading();
              openDialog(<ErrorDialog />);
              return;
            }
          }

        } 
     }

      useEffect(() => {

         setJoin(true)

      },[join, sucess])

     return(
      <Page
       header={<Title title={'회원가입'}/>}
       footer={<Navi data={naviDB.join}/>}
      >
        {join && (
        <div className="join">
           <div className="joinBox">
             <h3>아이디 및 비밀번호를 설정해주세요</h3>
          <MyForm.Form
            id="join_form"
            className="JoinForm"
            initialValue={{
                join_id : "",
                join_password : ""
            }}
            validate={validate}
            // onSubmit={(e) => onClick(e.target.value)}

          >
            <Formcontrol
            label='아이디'
            htmlFor='join_id'
            required
            error={<MyForm.ErrorMessage name='join_id'/>}
            >
            <MyForm.FormField 
             type="text"
             placeholder="아이디를 입력해주세요"
             name="join_id"
            />
            </Formcontrol>
            <Formcontrol
             label='비밀번호'
             required
             htmlFor='join_password'
             error={<MyForm.ErrorMessage name='join_password' />}
            >
            <MyForm.FormField 
             type="password"
             placeholder="비밀번호를 입력해주세요"
             name="join_password"
            />
            </Formcontrol>
          </MyForm.Form>
            <button className='submitBtn' onClick={(e) => {onClick(e.target)}}>회원가입하기</button>
            </div>
        </div> )}
      </Page>
     )

}

export default Join;