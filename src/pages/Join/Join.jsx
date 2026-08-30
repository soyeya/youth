import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Page from '../../components/Page';
import Title from '../../components/Title';
import Navi from '../../components/Navi';
import naviDB from '../../json/navi.json';
import * as MyLayout from '../../lib/MyLayout.jsx';
import API_BASE from '../../utils/apiConfig';

const ID_REG = /^[a-z]+[a-z0-9]{5,19}$/;
const PW_REG = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;
const EMAIL_REG = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REG = /^.{2,}$/;

const Join = () => {
  const navigate = useNavigate();
  const { startLoading, finishLoading } = MyLayout.useLoading();

  /* ── 폼 필드 ── */
  const [name, setName]           = useState('');
  const [userId, setUserId]       = useState('');
  const [password, setPassword]   = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [email, setEmail]         = useState('');
  const [code, setCode]           = useState('');

  /* ── 상태 플래그 ── */
  const [idChecked, setIdChecked]         = useState(false);
  const [emailSent, setEmailSent]         = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSkipped, setEmailSkipped]   = useState(false);

  /* ── 에러 메시지 ── */
  const [errors, setErrors] = useState({});
  /* ── 재전송 쿨다운 ── */
  const [sendCooldown, setSendCooldown] = useState(0);

  const setErr = (key, msg) => setErrors(p => ({ ...p, [key]: msg }));
  const clearErr = (key) => setErrors(p => { const n = { ...p }; delete n[key]; return n; });

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    setIdChecked(false);
    clearErr('userId');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailSent(false);
    setEmailVerified(false);
    setEmailSkipped(false);
    clearErr('email');
    clearErr('code');
  };

  /* ── 아이디 중복확인 ── */
  const checkId = useCallback(async () => {
    const v = userId.trim();
    if (!ID_REG.test(v)) {
      return setErr('userId', '아이디는 영문 소문자로 시작하는 영문+숫자 6~20자입니다');
    }
    try {
      const res = await axios.get(`${API_BASE}/checkId`, { params: { userId: v } });
      if (res.data.available) {
        setIdChecked(true);
        clearErr('userId');
      } else {
        setIdChecked(false);
        setErr('userId', '이미 사용 중인 아이디입니다');
      }
    } catch {
      setErr('userId', '중복확인 중 오류가 발생했습니다');
    }
  }, [userId]);

  /* ── 인증코드 발송 ── */
  const sendCode = useCallback(async () => {
    const v = email.trim();
    if (!EMAIL_REG.test(v)) {
      return setErr('email', '올바른 이메일 형식을 입력해주세요');
    }
    if (sendCooldown > 0) return;
    try {
      startLoading('인증코드 발송 중...');
      const res = await axios.post(`${API_BASE}/sendVerifyEmail`, { email: v });
      finishLoading();
      setEmailSent(true);
      clearErr('email');
      clearErr('code');

      if (res.data.skipped) {
        setEmailVerified(true);
        setEmailSkipped(true);
      } else {
        setSendCooldown(60);
        const t = setInterval(() => {
          setSendCooldown(s => {
            if (s <= 1) { clearInterval(t); return 0; }
            return s - 1;
          });
        }, 1000);
      }
    } catch (err) {
      finishLoading();
      setErr('email', err.response?.data?.error || '인증코드 발송 실패. 잠시 후 다시 시도해주세요');
    }
  }, [email, sendCooldown, startLoading, finishLoading]);

  /* ── 인증코드 확인 ── */
  const verifyCode = useCallback(async () => {
    const v = code.trim();
    if (!v) return setErr('code', '인증코드를 입력해주세요');
    try {
      await axios.post(`${API_BASE}/verifyEmailCode`, { email: email.trim(), code: v });
      setEmailVerified(true);
      clearErr('code');
    } catch (err) {
      setErr('code', err.response?.data?.error || '인증코드가 올바르지 않습니다');
    }
  }, [email, code]);

  /* ── 회원가입 제출 ── */
  const handleSubmit = async () => {
    const errs = {};
    if (!NAME_REG.test(name.trim()))   errs.name = '이름을 2자 이상 입력해주세요';
    if (!ID_REG.test(userId.trim()))   errs.userId = '아이디 형식을 확인해주세요';
    else if (!idChecked)               errs.userId = '아이디 중복확인을 완료해주세요';
    if (!PW_REG.test(password))        errs.password = '비밀번호는 영문+숫자 조합 8~16자입니다';
    if (password !== pwConfirm)        errs.pwConfirm = '비밀번호가 일치하지 않습니다';
    if (!EMAIL_REG.test(email.trim())) errs.email = '올바른 이메일 형식을 입력해주세요';
    else if (!emailVerified)           errs.email = '이메일 인증을 완료해주세요';

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      startLoading('회원가입 중...');
      await axios.post(`${API_BASE}/join`, {
        userId: userId.trim(),
        userPassword: password,
        userName: name.trim(),
        userEmail: email.trim(),
      });
      finishLoading();
      alert(`${userId.trim()}님 환영합니다! 로그인해주세요.`);
      navigate('/login');
    } catch (err) {
      finishLoading();
      alert(err.response?.data?.error || '서버 연결 실패');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <Page header={<Title title={'회원가입'} />} footer={<Navi data={naviDB.join} />}>
      <div className="join" onKeyDown={handleKeyDown}>
        <div className="joinBox joinBox--new">
          <h3>회원 정보를 입력해주세요</h3>

          {/* 이름 */}
          <div className="jf-row">
            <label className="jf-label" htmlFor="jf-name">
              이름 <span className="jf-req">*</span>
            </label>
            <div className="jf-field">
              <input
                id="jf-name"
                type="text"
                className={'jf-input' + (errors.name ? ' jf-input--err' : '')}
                placeholder="이름을 입력해주세요 (2자 이상)"
                value={name}
                onChange={e => { setName(e.target.value); clearErr('name'); }}
                autoFocus
              />
              {errors.name && <p className="jf-err-msg">{errors.name}</p>}
            </div>
          </div>

          {/* 아이디 + 중복확인 */}
          <div className="jf-row">
            <label className="jf-label" htmlFor="jf-id">
              아이디 <span className="jf-req">*</span>
            </label>
            <div className="jf-field">
              <div className="jf-inline">
                <input
                  id="jf-id"
                  type="text"
                  className={'jf-input' + (errors.userId ? ' jf-input--err' : '')}
                  placeholder="영문 소문자 시작, 6~20자"
                  value={userId}
                  onChange={handleUserIdChange}
                  autoComplete="username"
                />
                <button
                  type="button"
                  className={'jf-side-btn' + (idChecked ? ' jf-side-btn--ok' : '')}
                  onClick={checkId}
                  disabled={idChecked}
                >
                  {idChecked ? '확인완료' : '중복확인'}
                </button>
              </div>
              {errors.userId && <p className="jf-err-msg">{errors.userId}</p>}
              {idChecked && <p className="jf-ok-msg">사용 가능한 아이디입니다 ✓</p>}
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="jf-row">
            <label className="jf-label" htmlFor="jf-pw">
              비밀번호 <span className="jf-req">*</span>
            </label>
            <div className="jf-field">
              <input
                id="jf-pw"
                type="password"
                className={'jf-input' + (errors.password ? ' jf-input--err' : '')}
                placeholder="영문+숫자 조합 8~16자"
                value={password}
                onChange={e => { setPassword(e.target.value); clearErr('password'); clearErr('pwConfirm'); }}
                autoComplete="new-password"
              />
              {errors.password && <p className="jf-err-msg">{errors.password}</p>}
              {!errors.password && PW_REG.test(password) && (
                <p className="jf-ok-msg">올바른 형식입니다 ✓</p>
              )}
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div className="jf-row">
            <label className="jf-label" htmlFor="jf-pw2">
              비밀번호 확인 <span className="jf-req">*</span>
            </label>
            <div className="jf-field">
              <input
                id="jf-pw2"
                type="password"
                className={'jf-input' + (errors.pwConfirm ? ' jf-input--err' : '')}
                placeholder="비밀번호를 다시 입력해주세요"
                value={pwConfirm}
                onChange={e => { setPwConfirm(e.target.value); clearErr('pwConfirm'); }}
                autoComplete="new-password"
              />
              {errors.pwConfirm && <p className="jf-err-msg">{errors.pwConfirm}</p>}
              {!errors.pwConfirm && pwConfirm && password === pwConfirm && (
                <p className="jf-ok-msg">비밀번호가 일치합니다 ✓</p>
              )}
            </div>
          </div>

          {/* 이메일 + 인증코드 전송 */}
          <div className="jf-row">
            <label className="jf-label" htmlFor="jf-email">
              이메일 <span className="jf-req">*</span>
            </label>
            <div className="jf-field">
              <div className="jf-inline">
                <input
                  id="jf-email"
                  type="email"
                  className={'jf-input' + (errors.email ? ' jf-input--err' : '')}
                  placeholder="example@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="email"
                />
                <button
                  type="button"
                  className={'jf-side-btn' + (emailVerified ? ' jf-side-btn--ok' : '')}
                  onClick={sendCode}
                  disabled={emailVerified || sendCooldown > 0}
                >
                  {emailVerified
                    ? '인증완료'
                    : sendCooldown > 0
                      ? `재전송(${sendCooldown}s)`
                      : emailSent ? '재전송' : '인증코드 전송'}
                </button>
              </div>
              {errors.email && <p className="jf-err-msg">{errors.email}</p>}
              {emailSkipped  && <p className="jf-ok-msg">이메일 인증 완료 ✓</p>}
              {emailSent && !emailSkipped && !emailVerified && (
                <p className="jf-hint-msg">인증코드를 입력해주세요 (5분 이내)</p>
              )}
            </div>
          </div>

          {/* 인증코드 입력 */}
          {emailSent && !emailSkipped && !emailVerified && (
            <div className="jf-row">
              <label className="jf-label" htmlFor="jf-code">
                인증코드 <span className="jf-req">*</span>
              </label>
              <div className="jf-field">
                <div className="jf-inline">
                  <input
                    id="jf-code"
                    type="text"
                    className={'jf-input' + (errors.code ? ' jf-input--err' : '')}
                    placeholder="6자리 코드 입력"
                    value={code}
                    onChange={e => { setCode(e.target.value); clearErr('code'); }}
                    maxLength={6}
                  />
                  <button type="button" className="jf-side-btn" onClick={verifyCode}>
                    확인
                  </button>
                </div>
                {errors.code && <p className="jf-err-msg">{errors.code}</p>}
              </div>
            </div>
          )}

          <button className="submitBtn jf-submit-btn" onClick={handleSubmit}>
            회원가입하기
          </button>
        </div>
      </div>
    </Page>
  );
};

export default Join;
