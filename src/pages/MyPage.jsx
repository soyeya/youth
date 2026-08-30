import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WishlistPanel from '../components/WishlistPanel';
import axios from 'axios';
import Page from '../components/Page';
import Title from '../components/Title';
import Navi from '../components/Navi';
import * as MyLayout from '../lib/MyLayout.jsx';
import useLoginStatus from '../utils/useLoginStatus';
import API_BASE from '../utils/apiConfig';

const PW_REG    = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;
const EMAIL_REG = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REG  = /^.{2,}$/;

const TABS = ['내 정보', '찜목록', '탈퇴하기'];

const MyPage = () => {
  const navigate = useNavigate();
  const { startLoading, finishLoading } = MyLayout.useLoading();
  const { upDateLogin, dataContent, logout } = useLoginStatus();

  const [tab, setTab] = useState(0);

  /* ── 내 정보 ── */
  const [info, setInfo]           = useState({ userId: '', userName: '', userEmail: '' });
  const [editing, setEditing]     = useState(false);
  const [editName, setEditName]   = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNewPw, setEditNewPw] = useState('');
  const [editCurPw, setEditCurPw] = useState('');
  const [infoErr, setInfoErr]     = useState({});
  const [infoLoaded, setInfoLoaded] = useState(false);

  /* ── 이메일 인증 (수정 시) ── */
  const [emailChanged, setEmailChanged]     = useState(false);  // 이메일이 원본과 달라졌는지
  const [emailSent, setEmailSent]           = useState(false);
  const [emailVerified, setEmailVerified]   = useState(false);
  const [emailSkipped, setEmailSkipped]     = useState(false);
  const [verifyCode, setVerifyCode]         = useState('');
  const [sendCooldown, setSendCooldown]     = useState(0);

  /* ── 탈퇴하기 ── */
  const [delPw, setDelPw]           = useState('');
  const [delConfirm, setDelConfirm] = useState('');
  const [delErr, setDelErr]         = useState('');

  /* ── 로그인 확인 & 내 정보 로딩 ── */
  useEffect(() => {
    if (upDateLogin && dataContent && !infoLoaded) {
      fetchInfo(dataContent[0]);
      setInfoLoaded(true);
    }
    // 초기화 완료 후 비로그인이면 redirect
    const timer = setTimeout(() => {
      if (!upDateLogin && infoLoaded === false) navigate('/login');
    }, 800);
    return () => clearTimeout(timer);
  }, [upDateLogin, dataContent, infoLoaded, navigate]);

  const fetchInfo = async (uid) => {
    try {
      const res = await axios.get(`${API_BASE}/myInfo`, { params: { userId: uid } });
      setInfo(res.data);
      setEditName(res.data.userName || '');
      setEditEmail(res.data.userEmail || '');
    } catch { /* silent */ }
  };

  /* ── 로그아웃 ── */
  const handleLogout = async () => {
    await logout(startLoading, finishLoading);
    navigate('/');
  };

  /* ── 이메일 변경 감지 ── */
  const handleEditEmailChange = (e) => {
    const val = e.target.value;
    setEditEmail(val);
    setInfoErr(p => ({ ...p, email: '' }));
    // 원본과 다르면 인증 초기화
    if (val.trim() !== (info.userEmail || '').trim()) {
      setEmailChanged(true);
      setEmailSent(false);
      setEmailVerified(false);
      setEmailSkipped(false);
      setVerifyCode('');
    } else {
      // 원본으로 되돌렸으면 인증 불필요
      setEmailChanged(false);
      setEmailVerified(false);
    }
  };

  /* ── 인증코드 발송 ── */
  const sendEmailCode = useCallback(async () => {
    const v = editEmail.trim();
    if (!EMAIL_REG.test(v)) return setInfoErr(p => ({ ...p, email: '올바른 이메일 형식을 입력해주세요' }));
    if (sendCooldown > 0) return;
    try {
      startLoading('인증코드 발송 중...');
      const res = await axios.post(`${API_BASE}/sendVerifyEmail`, { email: v });
      finishLoading();
      setEmailSent(true);
      setInfoErr(p => ({ ...p, email: '', code: '' }));
      if (res.data.skipped) {
        setEmailVerified(true);
        setEmailSkipped(true);
      } else {
        setSendCooldown(60);
        const t = setInterval(() => {
          setSendCooldown(s => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; });
        }, 1000);
      }
    } catch (err) {
      finishLoading();
      setInfoErr(p => ({ ...p, email: err.response?.data?.error || '인증코드 발송 실패' }));
    }
  }, [editEmail, sendCooldown, startLoading, finishLoading]);

  /* ── 인증코드 확인 ── */
  const confirmEmailCode = useCallback(async () => {
    const v = verifyCode.trim();
    if (!v) return setInfoErr(p => ({ ...p, code: '인증코드를 입력해주세요' }));
    try {
      await axios.post(`${API_BASE}/verifyEmailCode`, { email: editEmail.trim(), code: v });
      setEmailVerified(true);
      setInfoErr(p => ({ ...p, code: '' }));
    } catch (err) {
      setInfoErr(p => ({ ...p, code: err.response?.data?.error || '인증코드가 올바르지 않습니다' }));
    }
  }, [editEmail, verifyCode]);

  /* ── 내 정보 수정 저장 ── */
  const handleSaveInfo = async () => {
    const errs = {};
    if (!NAME_REG.test(editName.trim()))   errs.name  = '이름을 2자 이상 입력해주세요';
    if (!EMAIL_REG.test(editEmail.trim())) errs.email = '올바른 이메일 형식을 입력해주세요';
    if (emailChanged && !emailVerified)    errs.email = '변경된 이메일 인증을 완료해주세요';
    if (editNewPw && !PW_REG.test(editNewPw)) errs.newPw = '비밀번호는 영문+숫자 조합 8~16자입니다';
    if (!editCurPw)                        errs.curPw = '현재 비밀번호를 입력해주세요';

    if (Object.keys(errs).length) return setInfoErr(errs);

    try {
      startLoading('정보 수정 중...');
      await axios.put(`${API_BASE}/myInfo`, {
        userId: dataContent[0],
        currentPassword: editCurPw,
        userName: editName.trim(),
        userEmail: editEmail.trim(),
        ...(editNewPw ? { newPassword: editNewPw } : {}),
      });
      finishLoading();
      alert('정보가 수정되었습니다.');
      setEditing(false);
      setEditCurPw('');
      setEditNewPw('');
      setEmailChanged(false);
      setEmailSent(false);
      setEmailVerified(false);
      setEmailSkipped(false);
      setVerifyCode('');
      setSendCooldown(0);
      setInfoErr({});
      fetchInfo(dataContent[0]);
    } catch (err) {
      finishLoading();
      const msg = err.response?.data?.error || '수정 실패. 다시 시도해주세요';
      if (msg.includes('비밀번호')) setInfoErr({ curPw: msg });
      else if (msg.includes('이메일')) setInfoErr({ email: msg });
      else alert(msg);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditName(info.userName || '');
    setEditEmail(info.userEmail || '');
    setEditNewPw('');
    setEditCurPw('');
    setEmailChanged(false);
    setEmailSent(false);
    setEmailVerified(false);
    setEmailSkipped(false);
    setVerifyCode('');
    setSendCooldown(0);
    setInfoErr({});
  };

  /* ── 회원 탈퇴 ── */
  const handleDelete = async () => {
    if (!delPw) return setDelErr('비밀번호를 입력해주세요');
    if (delConfirm !== '탈퇴합니다') return setDelErr('"탈퇴합니다"를 정확히 입력해주세요');
    if (!window.confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      startLoading('탈퇴 처리 중...');
      await axios.delete(`${API_BASE}/account`, { data: { userId: dataContent[0], password: delPw } });
      finishLoading();
      alert('탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
      navigate('/');
    } catch (err) {
      finishLoading();
      setDelErr(err.response?.data?.error || '탈퇴 처리 실패. 비밀번호를 확인해주세요');
    }
  };

  if (!upDateLogin) return null;

  return (
    <Page
      header={<Title title={'마이페이지'} />}
      footer={<Navi Mylist onClick={handleLogout} />}
    >
      <div className="mypage-wrap">

        {/* 탭 */}
        <div className="mypage-tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={'mypage-tab' + (tab === i ? ' active' : '') + (i === 2 ? ' danger' : '')}
              onClick={() => setTab(i)}
            >{t}</button>
          ))}
        </div>

        {/* ── 내 정보 ── */}
        {tab === 0 && (
          <div className="mypage-section">
            <h4 className="mypage-section-title">내 정보</h4>

            {!editing ? (
              <div className="mypage-info-view">
                <div className="mypage-info-row">
                  <span className="mypage-info-label">아이디</span>
                  <span className="mypage-info-value">{info.userId || dataContent?.[0]}</span>
                </div>
                <div className="mypage-info-row">
                  <span className="mypage-info-label">이름</span>
                  <span className="mypage-info-value">{info.userName || '—'}</span>
                </div>
                <div className="mypage-info-row">
                  <span className="mypage-info-label">이메일</span>
                  <span className="mypage-info-value">{info.userEmail || '—'}</span>
                </div>
                <button className="mypage-edit-btn" onClick={() => setEditing(true)}>정보 수정</button>
              </div>
            ) : (
              <div className="mypage-info-edit">

                {/* 아이디 (읽기전용) */}
                <div className="mypage-edit-row">
                  <label className="mypage-edit-label">아이디</label>
                  <span className="mypage-edit-static">{info.userId || dataContent?.[0]}</span>
                </div>

                {/* 이름 */}
                <div className="mypage-edit-row">
                  <label className="mypage-edit-label" htmlFor="mp-name">이름</label>
                  <div className="mypage-edit-field">
                    <input
                      id="mp-name" type="text"
                      className={'mypage-input' + (infoErr.name ? ' err' : '')}
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setInfoErr(p => ({ ...p, name: '' })); }}
                      placeholder="이름 입력"
                    />
                    {infoErr.name && <p className="mypage-err">{infoErr.name}</p>}
                  </div>
                </div>

                {/* 이메일 + 인증코드 전송 */}
                <div className="mypage-edit-row">
                  <label className="mypage-edit-label" htmlFor="mp-email">이메일</label>
                  <div className="mypage-edit-field">
                    <div className="jf-inline">
                      <input
                        id="mp-email" type="email"
                        className={'mypage-input' + (infoErr.email ? ' err' : '')}
                        value={editEmail}
                        onChange={handleEditEmailChange}
                        placeholder="이메일 입력"
                      />
                      {emailChanged && !emailVerified && (
                        <button
                          type="button"
                          className={'jf-side-btn' + (sendCooldown > 0 ? '' : '')}
                          onClick={sendEmailCode}
                          disabled={sendCooldown > 0}
                        >
                          {sendCooldown > 0
                            ? `재전송(${sendCooldown}s)`
                            : emailSent ? '재전송' : '인증코드 전송'}
                        </button>
                      )}
                      {emailVerified && (
                        <span className="mp-email-ok">인증완료 ✓</span>
                      )}
                    </div>
                    {infoErr.email && <p className="mypage-err">{infoErr.email}</p>}
                    {emailSkipped && <p className="jf-ok-msg">이메일 인증 완료 ✓</p>}
                    {emailSent && !emailSkipped && !emailVerified && (
                      <p className="jf-hint-msg">인증코드를 입력해주세요 (5분 이내)</p>
                    )}
                  </div>
                </div>

                {/* 인증코드 입력란 */}
                {emailSent && !emailSkipped && !emailVerified && (
                  <div className="mypage-edit-row">
                    <label className="mypage-edit-label" htmlFor="mp-code">인증코드</label>
                    <div className="mypage-edit-field">
                      <div className="jf-inline">
                        <input
                          id="mp-code" type="text"
                          className={'mypage-input' + (infoErr.code ? ' err' : '')}
                          value={verifyCode}
                          onChange={e => { setVerifyCode(e.target.value); setInfoErr(p => ({ ...p, code: '' })); }}
                          placeholder="6자리 코드 입력"
                          maxLength={6}
                        />
                        <button type="button" className="jf-side-btn" onClick={confirmEmailCode}>확인</button>
                      </div>
                      {infoErr.code && <p className="mypage-err">{infoErr.code}</p>}
                    </div>
                  </div>
                )}

                {/* 새 비밀번호 */}
                <div className="mypage-edit-row">
                  <label className="mypage-edit-label" htmlFor="mp-newpw">새 비밀번호</label>
                  <div className="mypage-edit-field">
                    <input
                      id="mp-newpw" type="password"
                      className={'mypage-input' + (infoErr.newPw ? ' err' : '')}
                      value={editNewPw}
                      onChange={e => { setEditNewPw(e.target.value); setInfoErr(p => ({ ...p, newPw: '' })); }}
                      placeholder="변경 시에만 입력 (8~16자)"
                      autoComplete="new-password"
                    />
                    {infoErr.newPw && <p className="mypage-err">{infoErr.newPw}</p>}
                  </div>
                </div>

                {/* 현재 비밀번호 (필수) */}
                <div className="mypage-edit-row">
                  <label className="mypage-edit-label" htmlFor="mp-curpw">
                    현재 비밀번호 <span className="jf-req">*</span>
                  </label>
                  <div className="mypage-edit-field">
                    <input
                      id="mp-curpw" type="password"
                      className={'mypage-input' + (infoErr.curPw ? ' err' : '')}
                      value={editCurPw}
                      onChange={e => { setEditCurPw(e.target.value); setInfoErr(p => ({ ...p, curPw: '' })); }}
                      placeholder="현재 비밀번호 입력"
                      autoComplete="current-password"
                    />
                    {infoErr.curPw && <p className="mypage-err">{infoErr.curPw}</p>}
                  </div>
                </div>

                <div className="mypage-edit-actions">
                  <button className="mypage-save-btn" onClick={handleSaveInfo}>저장</button>
                  <button className="mypage-cancel-btn" onClick={handleCancelEdit}>취소</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 찜목록 ── */}
        {tab === 1 && (
          <div className="mypage-section mypage-section--wishlist">
            <WishlistPanel userId={dataContent?.[0]} compact />
          </div>
        )}

        {/* ── 탈퇴하기 ── */}
        {tab === 2 && (
          <div className="mypage-section">
            <h4 className="mypage-section-title danger">회원 탈퇴</h4>
            <p className="mypage-del-warn">
              탈퇴 시 모든 찜목록과 계정 정보가 <strong>영구 삭제</strong>됩니다.<br />
              신중히 결정해주세요.
            </p>
            <div className="mypage-edit-row">
              <label className="mypage-edit-label" htmlFor="mp-delpw">비밀번호</label>
              <div className="mypage-edit-field">
                <input
                  id="mp-delpw" type="password" className="mypage-input"
                  value={delPw}
                  onChange={e => { setDelPw(e.target.value); setDelErr(''); }}
                  placeholder="현재 비밀번호 입력"
                />
              </div>
            </div>
            <div className="mypage-edit-row">
              <label className="mypage-edit-label" htmlFor="mp-delconfirm">탈퇴 확인</label>
              <div className="mypage-edit-field">
                <input
                  id="mp-delconfirm" type="text" className="mypage-input"
                  value={delConfirm}
                  onChange={e => { setDelConfirm(e.target.value); setDelErr(''); }}
                  placeholder='"탈퇴합니다" 입력'
                />
                <p className="mypage-hint">아래 텍스트를 그대로 입력해주세요: <strong>탈퇴합니다</strong></p>
              </div>
            </div>
            {delErr && <p className="mypage-err del-err">{delErr}</p>}
            <button className="mypage-del-btn" onClick={handleDelete}>탈퇴하기</button>
          </div>
        )}
      </div>
    </Page>
  );
};

export default MyPage;
