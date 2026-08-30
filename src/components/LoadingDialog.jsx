import React, { useState, useEffect } from 'react';

/**
 * LoadingDialog
 * 응답 경과 시간에 따라 4단계 메시지를 표시합니다.
 *
 * phase 0  ( 0 ~  4s): 초기 로딩 메시지 + 파란 스피너
 * phase 1  ( 4 ~  9s): 느림 경고 메시지 + 노란 스피너
 * phase 2  ( 9 ~ 16s): 지연 경고 메시지 + 주황 스피너
 * phase 3  (16s ~   ): 시간 초과 메시지 + 빨간 스피너 + 재시도 버튼
 */

const PHASES = [
  {
    delay: 0,
    spinnerClass: 'loading-spinner phase-normal',
    message: null,           // startLoading(message) 에서 전달된 초기 메시지 사용
    sub: null,
  },
  {
    delay: 4000,
    spinnerClass: 'loading-spinner phase-slow',
    message: '조금 시간이 걸리고 있어요',
    sub: '잠시만 기다려 주세요 :)',
  },
  {
    delay: 9000,
    spinnerClass: 'loading-spinner phase-delay',
    message: '응답이 지연되고 있습니다',
    sub: '네트워크 상태를 확인하거나\n잠시 후 다시 시도해 주세요.',
  },
  {
    delay: 16000,
    spinnerClass: 'loading-spinner phase-timeout',
    message: '응답 대기 시간이 초과됐습니다',
    sub: '서버가 일시적으로 응답하지 않고 있습니다.\n아래 버튼을 눌러 페이지를 새로고침 해주세요.',
    showRetry: true,
  },
];

const LoadingDialog = ({ message }) => {
  const [phase, setPhase] = useState(0);
  const [dots, setDots] = useState('');

  // 단계 전환 타이머
  useEffect(() => {
    const timers = PHASES.slice(1).map((p) =>
      setTimeout(() => setPhase((prev) => prev + 1), p.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // 점 애니메이션 (... 반복)
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const current = PHASES[phase];
  const displayMessage = phase === 0 ? message : current.message;

  return (
    <div className="loading-overlay">
      <div className={`loading-box loading-phase-${phase}`}>
        {/* 스피너 */}
        <div className={current.spinnerClass}>
          <div className="loading-spinner-inner" />
        </div>

        {/* 단계 인디케이터 */}
        <div className="loading-steps">
          {PHASES.map((_, i) => (
            <span
              key={i}
              className={`loading-step-dot ${i <= phase ? 'active' : ''} ${i === phase ? 'current' : ''}`}
            />
          ))}
        </div>

        {/* 메시지 */}
        <p className="loading-message">
          {displayMessage}
          <span className="loading-dots" aria-hidden="true">{dots}</span>
        </p>

        {/* 서브 메시지 */}
        {current.sub && (
          <p className="loading-sub">{current.sub}</p>
        )}

        {/* phase 3: 재시도 버튼 */}
        {current.showRetry && (
          <button
            className="loading-retry-btn"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingDialog;
