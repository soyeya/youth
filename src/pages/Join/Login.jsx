import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page';
import Title from '../../components/Title';
import Navi from '../../components/Navi';
import naviDB from '../../json/navi.json';
import Formcontrol from '../../components/Formcontrol.jsx';
import * as MyForm from '../../lib/MyForm.jsx';
import * as MyLayout from '../../lib/MyLayout.jsx';
import API_BASE from '../../utils/apiConfig';

const ID_REG_EXP = /^[a-z]+[a-z0-9]{5,19}$/;
const PASSWORD_REG_EXP = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;

/** 입력값 검증 — 빈 칸과 형식 오류를 구분해서 안내 */
const getFieldError = (name, value) => {
  const v = (value || '').trim();
  if (name === 'login_id') {
    if (!v) return '아이디를 입력해주세요';
    if (!ID_REG_EXP.test(v)) return '아이디는 영문 소문자로 시작하는 영문+숫자 6~20자입니다';
    return '';
  }
  if (!v) return '비밀번호를 입력해주세요';
  if (!PASSWORD_REG_EXP.test(v)) return '비밀번호는 영문+숫자 조합 8~16자입니다';
  return '';
};

const Login = () => {
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { startLoading, finishLoading } = MyLayout.useLoading();

  const validate = (values) => {
    const errors = {};
    const idError = getFieldError('login_id', values.login_id);
    const passwordError = getFieldError('login_password', values.login_password);
    if (idError) errors.login_id = idError;
    if (passwordError) errors.login_password = passwordError;
    return errors;
  };

  const handleLogin = async () => {
    if (!ready || submitting) return;
    const form = document.getElementById('login_form');
    if (!form) return;

    const value_id = form.login_id?.value?.trim() || '';
    const value_password = form.login_password?.value || '';

    // 잘못된 항목에 포커스를 옮겨 키보드만으로 이어서 수정할 수 있게 함
    const idError = getFieldError('login_id', value_id);
    if (idError) {
      form.login_id?.focus();
      return alert(idError);
    }
    const passwordError = getFieldError('login_password', value_password);
    if (passwordError) {
      form.login_password?.focus();
      return alert(passwordError);
    }

    setSubmitting(true);
    startLoading('로그인 시도중...');
    try {
      const res = await axios.post(`${API_BASE}/login`, [value_id, value_password]);
      if (res.data?.success) {
        navigate('/');
        return;
      }
      alert('아이디 또는 비밀번호가 일치하지 않습니다');
    } catch (err) {
      alert(err.response?.data?.error || '서버 연결 실패');
    } finally {
      finishLoading();
      setSubmitting(false);
    }
  };

  // Enter 키로 로그인 (입력창·버튼 어디에서든 동작)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  useEffect(() => { setReady(true); }, []);

  return (
    <Page header={<Title title={'로그인'} />} footer={<Navi data={naviDB.join} />}>
      {ready && (
        <div className="join login">
          <div className="joinBox" onKeyDown={handleKeyDown}>
            <h3>아이디 및 비밀번호를 입력해주세요</h3>
            <MyForm.Form
              id="login_form"
              initialValue={{ login_id: '', login_password: '' }}
              validate={validate}
            >
              <Formcontrol label={'아이디'} htmlFor="login_id" required
                error={<MyForm.ErrorMessage name="login_id" />}>
                <MyForm.FormField
                  type="text"
                  placeholder="아이디를 입력해주세요"
                  name="login_id"
                  autoComplete="username"
                  autoFocus
                />
              </Formcontrol>
              <Formcontrol label={'비밀번호'} required htmlFor="login_password"
                error={<MyForm.ErrorMessage name="login_password" />}>
                <MyForm.FormField
                  type="password"
                  placeholder="비밀번호를 입력해주세요"
                  name="login_password"
                  autoComplete="current-password"
                />
              </Formcontrol>
            </MyForm.Form>
            <button className="submitBtn" onClick={handleLogin} disabled={submitting}>
              {submitting ? '로그인 중...' : '로그인'}
            </button>
            <div className="login-join-row">
              <span className="login-join-text">아직 회원이 아니신가요?</span>
              <Link to="/join" className="login-join-btn">회원가입</Link>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default Login;
