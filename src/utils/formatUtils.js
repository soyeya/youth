/**
 * formatUtils.js
 * 빈값 처리 및 날짜 포맷 유틸리티
 */

/**
 * null / undefined / 공백 → '정보없음'
 * 그 외 값은 그대로 반환
 */
export const formatValue = (val) => {
  if (val === null || val === undefined) return '정보없음';
  if (typeof val === 'string' && val.trim() === '') return '정보없음';
  if (typeof val === 'string' && val.trim() === '-') return '정보없음';
  return val;
};

/**
 * 날짜 문자열 → YYYY-MM-DD 형식으로 변환
 * 지원 형식:
 *   '20260520'     → '2026-05-20'
 *   '2026-05-20'   → '2026-05-20' (그대로)
 *   '2026.05.20'   → '2026-05-20'
 * 빈값/null/undefined → '정보없음'
 */
export const formatDate = (val) => {
  if (val === null || val === undefined) return '정보없음';
  const str = String(val).trim();
  if (str === '' || str === '-' || str === 'null' || str === 'undefined') return '정보없음';

  // 숫자만 추출해서 8자리 (YYYYMMDD)
  const digits = str.replace(/[^0-9]/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  // 이미 YYYY-MM-DD 형태
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  // 그 외 알 수 없는 형식은 그대로
  return str;
};

/**
 * 마감일까지 남은 일수. 날짜를 해석할 수 없으면 null
 * 음수면 이미 마감된 항목
 */
export const getDday = (val) => {
  if (!val) return null;
  const digits = String(val).replace(/[^0-9]/g, '');
  if (digits.length !== 8) return null;
  const end = new Date(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
};

export const isExpired = (val) => {
  const dday = getDday(val);
  return dday !== null && dday < 0;
};

export const isUrgent = (val) => {
  const dday = getDday(val);
  return dday !== null && dday >= 0 && dday <= 7;
};
