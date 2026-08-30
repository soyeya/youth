/**
 * 찜 목록 카테고리 유틸
 * DB의 section 값은 예전 데이터에 '없음'이나 금융 상품유형('정기예금' 등)이
 * 섞여 있으므로, 항상 정확한 link 경로를 우선으로 카테고리를 판정한다.
 */

export const CATEGORY_ORDER = ['일자리', '주거', '복지', '교육', '금융', 'LH', 'SH', '기타'];

const LINK_PREFIX_MAP = [
  ['/details/job',       '일자리'],
  ['/details/residence', '주거'],
  ['/details/welfare',   '복지'],
  ['/details/education', '교육'],
  ['/details/finance',   '금융'],
  ['/details/lh',        'LH'],
  ['/details/sh',        'SH'],
];

export const resolveCategory = (link, section) => {
  const path = String(link || '');
  const matched = LINK_PREFIX_MAP.find(([prefix]) => path.startsWith(prefix));
  if (matched) return matched[1];
  if (section && CATEGORY_ORDER.includes(section)) return section;
  return '기타';
};

export const sortCategories = (categories) =>
  [...categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? CATEGORY_ORDER.length : ia) - (ib === -1 ? CATEGORY_ORDER.length : ib);
  });
