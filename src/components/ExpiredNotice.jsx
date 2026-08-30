import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 찜해둔 항목이 마감되었거나 원본에서 내려간 경우의 안내 화면
 * props:
 *   itemTitle - 찜해둔 제목
 *   label     - '정책' | '공고' | '상품'
 *   onRemove  - 찜 해제 함수 (찜한 항목일 때만 전달)
 */
const ExpiredNotice = ({ itemTitle, label = '공고', onRemove }) => {
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove();
    navigate('/myList');
  };

  return (
    <div className="detail pol-detail">
      <div className="pol-gone">
        <p className="pol-gone-title">종료된 {label}입니다</p>
        {itemTitle && <p className="pol-gone-name">{itemTitle}</p>}
        <p className="pol-gone-desc">
          신청 기간이 끝났거나 더 이상 제공되지 않아 상세 정보를 확인할 수 없습니다.
          <br />
          찜목록에서 다른 항목을 확인해보세요.
        </p>
        <div className="pol-gone-actions">
          <button className="pol-gone-btn primary" onClick={() => navigate('/myList')}>
            찜목록으로 돌아가기
          </button>
          {onRemove && (
            <button className="pol-gone-btn" onClick={handleRemove} disabled={removing}>
              {removing ? '해제 중...' : '찜목록에서 삭제'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpiredNotice;
