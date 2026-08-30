import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API_BASE from './apiConfig';

/**
 * 찜하기 상태 관리 훅
 * @param {string|null} userId   로그인된 유저 ID (null이면 비로그인)
 * @param {string}      section  카테고리 (일자리 / 주거 / 복지 / 교육 / 금융 / LH / SH)
 * @param {string}      link     상세 페이지 링크
 * @param {string}      title    항목 제목 (DB 식별 키)
 * @param {string}      applyEnd 신청 마감일 — 찜목록에서 마감 표시에 사용
 * @param {string}      banknm   금융사명 — 금융 상품 찜 시 표시용 (선택)
 */
const useWishlist = ({ userId, section, link, title, applyEnd, banknm }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  // 뒤늦게 로드되는 값은 ref로만 참조 (재조회 트리거 없음)
  const applyEndRef = useRef(applyEnd);
  applyEndRef.current = applyEnd;

  const banknmRef = useRef(banknm);
  banknmRef.current = banknm;

  useEffect(() => {
    if (!userId || !title) { setIsWishlisted(false); return; }
    axios.get(`${API_BASE}/MyList`, { params: { userId } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setIsWishlisted(data.some((d) => d.userId === userId && d.title === title));
      })
      .catch(() => {});
  }, [userId, title]);

  const toggleWishlist = useCallback(async () => {
    if (!userId) return { ok: false, msg: '로그인 이후 이용가능합니다' };
    try {
      if (isWishlisted) {
        await axios.delete(`${API_BASE}/MyList`, { data: { userId, title } });
        setIsWishlisted(false);
        return { ok: true, action: 'removed', msg: '찜을 해제했습니다' };
      }
      const res = await axios.post(`${API_BASE}/MyList`, {
        userId, section, link, title,
        applyEnd: applyEndRef.current,
        banknm:   banknmRef.current || null,
      });
      setIsWishlisted(true);
      return {
        ok: true,
        action: 'added',
        msg: res.data === 'already' ? '이미 찜한 항목입니다' : '찜에 성공했습니다',
      };
    } catch {
      return { ok: false, msg: '오류가 발생했습니다' };
    }
  }, [userId, title, section, link, isWishlisted]);

  return { isWishlisted, toggleWishlist };
};

export default useWishlist;
