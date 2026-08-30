const axios = require('axios');
const convert = require('xml-js');
const selectDB = require('../json/select.json');

// API 키는 .env 파일에서 로드 (절대 코드에 하드코딩하지 말 것)
const YOUTH_API_KEY = process.env.YOUTH_API_KEY;
const YOUTH_JOB_API_KEY = process.env.YOUTH_JOB_API_KEY;
const FINANCE_API_KEY = process.env.FINANCE_API_KEY;
const LH_API_KEY = process.env.LH_API_KEY;

if (!YOUTH_API_KEY || !FINANCE_API_KEY) {
  console.warn('⚠ 경고: API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

// 온통청년 API - 청년 정책 전체 조회
const news_api = async () => {
  const size = `100`;
  try {
    const res = await axios.get(
      `https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${YOUTH_API_KEY}&pageSize=${size}`
    );
    const data = res.data.result;
    console.log('news_api 호출 완료');
    return data;
  } catch (error) {
    console.log('boardJs newsApi Err', error.message || error);
    return null;
  }
};

// 일자리 정책 지역별 조회 (youthPlcyList API)
const job_api = async (values) => {
  const work = `023010`;
  const value = Object.keys(values)[0];

  try {
    let found = false;
    for (let v of selectDB.region) {
      if (value === v.name) {
        found = true;
        const res = await axios.get(
          encodeURI(
            `https://www.youthcenter.go.kr/opi/youthPlcyList.do?openApiVlak=${YOUTH_JOB_API_KEY}&pageIndex=1&display=20&srchPolyBizSecd=${v.code}&bizTycdSel=${work}`
          )
        );
        const data = convert.xml2json(res.data, { compact: true, spaces: 4 });
        return data;
      }
    }
    if (!found) return '검색결과없음';
  } catch (error) {
    console.log('boardJs jobApi Err', error.message || error);
    return null;
  }
};

// 주거 정책 조회
const residence_api = async () => {
  const size = `100`;
  try {
    const res = await axios.get(
      `https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${YOUTH_API_KEY}&pageSize=${size}&bscPlanPlcyWayNo=002`
    );
    const data = res.data.result;
    console.log('residence_api 호출 완료');
    return data;
  } catch (error) {
    console.log('boardJs residenceApi Err', error.message || error);
    return null;
  }
};

// 복지 정책 조회
const welfare_api = async () => {
  const size = `100`;
  try {
    const res = await axios.get(
      `https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${YOUTH_API_KEY}&pageSize=${size}&bscPlanPlcyWayNo=004`
    );
    const data = res.data.result;
    console.log('welfare_api 호출 완료');
    return data;
  } catch (error) {
    console.log('boardJs welfareApi Err', error.message || error);
    return null;
  }
};

// 교육 정책 조회
const education_api = async () => {
  const size = `100`;
  try {
    const res = await axios.get(
      `https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${YOUTH_API_KEY}&pageSize=${size}&bscPlanPlcyWayNo=003`
    );
    const data = res.data.result;
    console.log('education_api 호출 완료');
    return data;
  } catch (error) {
    console.log('boardJs educationApi Err', error.message || error);
    return null;
  }
};

// ──────────────────────────────────────────────────────────────
// 금융 상품 조회 (FSS 금융감독원 금융상품 비교공시 API)
// ──────────────────────────────────────────────────────────────
const PENSION_SECTIONS = ['020000', '030000', '040000', '050000'];

const finance_api = async (values) => {
  const value = Object.keys(values)[0];

  try {
    for (let v of selectDB.bank) {
      if (value !== v.name) continue;

      console.log('finance_api 조회:', value, v.code);

      // ── 연금저축: 4개 권역 병렬 조회 후 합산 ──────────────
      if (value === '연금저축') {
        const settled = await Promise.allSettled(
          PENSION_SECTIONS.map((sec) =>
            axios.get(
              `https://finlife.fss.or.kr/finlifeapi/${v.code}.json?auth=${FINANCE_API_KEY}&topFinGrpNo=${sec}&pageNo=1`
            )
          )
        );

        const validResults = settled
          .filter((r) => r.status === 'fulfilled' && r.value.data?.result)
          .map((r) => r.value.data.result);

        const toArray = (val) =>
          Array.isArray(val) ? val : val ? [val] : [];

        const baseList = validResults.flatMap((r) => toArray(r.baseList));
        const optionList = validResults.flatMap((r) => toArray(r.optionList));

        console.log(
          `연금저축 합산 결과: baseList ${baseList.length}건, optionList ${optionList.length}건`
        );

        return { baseList, optionList };
      }

      // ── 나머지 상품: 단일 권역 조회 ──────────────────────
      const res = await axios.get(
        `https://finlife.fss.or.kr/finlifeapi/${v.code}.json?auth=${FINANCE_API_KEY}&topFinGrpNo=${v.section}&pageNo=1`
      );
      return res.data.result;
    }

    return null;
  } catch (error) {
    console.log('boardJs financeApi Err', error.message || error);
    return null;
  }
};

// ──────────────────────────────────────────────────────────────
// LH (한국토지주택공사) 청년 임대 공고 조회
//
// 서비스 15058530: 한국토지주택공사_분양임대공고문 조회 서비스
// Base URL: https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1
//
// ⚠ serviceKey 인코딩 주의:
//   .env의 키는 이미 URL 인코딩된 값(data.go.kr 발급 형태)입니다.
//   axios params로 전달하면 이중 인코딩(%2F→%252F)이 발생하므로
//   URL 문자열에 직접 삽입해야 합니다.
//
// 청년 대상 주거유형 코드 (AIS_TP_CD):
//   07 = 행복주택  (청년 특화)
//   09 = 매입임대  (청년 우선공급)
//   17 = 전세임대  (청년 우선공급)
// ──────────────────────────────────────────────────────────────
const YOUTH_LH_TYPES     = ['07', '09', '17'];
const YOUTH_LH_TYPE_NAMES = ['행복주택', '매입임대', '전세임대'];

// 응답이 XML 오류 메시지인지 확인
const isXmlError = (data) =>
  typeof data === 'string' && data.includes('OpenAPI_ServiceResponse');

// JSON 응답에서 공고 목록 추출
// LH API 실제 응답 형태: [ {"dsSch":[...]}, {"dsList":[...공고목록...]} ]
const extractLhList = (raw) => {
  if (!raw) return [];

  // 배열 형태: 각 요소에서 dsList/list/items 탐색
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && typeof item === 'object') {
        if (item.dsList) return Array.isArray(item.dsList) ? item.dsList : [item.dsList];
        if (item.list)   return Array.isArray(item.list)   ? item.list   : [item.list];
        if (item.items)  return Array.isArray(item.items)  ? item.items  : [item.items];
      }
    }
    // 배열 자체가 공고 목록인 경우
    if (raw.length > 0 && raw[0] && (raw[0].PAN_ID || raw[0].PAN_NM)) return raw;
  }

  // 단일 객체
  if (raw.dsList)  return Array.isArray(raw.dsList)  ? raw.dsList  : [raw.dsList];
  if (raw.list)    return Array.isArray(raw.list)    ? raw.list    : [raw.list];
  if (raw.items)   return Array.isArray(raw.items)   ? raw.items   : [raw.items];
  if (raw.response?.body?.items) {
    const items = raw.response.body.items;
    return Array.isArray(items) ? items : [items];
  }
  return [];
};

// API 응답 필드명 → 앱 내부 스키마로 정규화
// (API가 반환하는 필드명이 Lh.jsx 기대 필드명과 다를 수 있음)
const normalizeLhItem = (item) => ({
  ...item,
  // 공고게시일: PAN_DT 없으면 PAN_NT_ST_DT 사용
  PAN_DT:   item.PAN_DT   || item.PAN_NT_ST_DT || '',
  // 지역명: SIDO_NM 없으면 CNP_CD_NM 사용
  SIDO_NM:  item.SIDO_NM  || item.CNP_CD_NM    || '',
  // 유형명: AIS_TP_NM 없으면 AIS_TP_CD_NM 사용
  AIS_TP_NM: item.AIS_TP_NM || item.AIS_TP_CD_NM || '',
});

// ──────────────────────────────────────────────────────────────
// 서비스 15058530: 분양임대공고문 조회
// 확정 엔드포인트: https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1
// 파라미터: ServiceKey, PAGE, PG_SZ  (pageIndex/numOfRows 사용 불가)
//
// ⚠ serviceKey 이중인코딩 주의:
//   .env 키는 이미 URL 인코딩된 값 — axios params 금지, URL 직접 삽입
// ──────────────────────────────────────────────────────────────
const LH_URL = 'https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1';

const lh_api = async () => {
  if (!LH_API_KEY) {
    console.warn('⚠ LH_API_KEY가 설정되지 않았습니다. .env에 LH_API_KEY를 추가하세요.');
    return null;
  }

  try {
    const fullUrl = `${LH_URL}?ServiceKey=${LH_API_KEY}&PAGE=1&PG_SZ=200`;
    console.log('lh_api 호출:', fullUrl.slice(0, 80) + '...');

    const res = await axios.get(fullUrl, {
      timeout: 15000,
      headers: { Accept: 'application/json, text/xml, */*' },
    });

    const raw = res.data;

    // XML 오류 응답 감지
    if (isXmlError(raw)) {
      const errMsg  = String(raw).match(/<errMsg>(.*?)<\/errMsg>/)?.[1];
      const errCode = String(raw).match(/<errCode>(.*?)<\/errCode>/)?.[1];
      console.warn(`lh_api XML 오류: ${errCode} - ${errMsg}`);
      return null;
    }

    // 목록 추출 + 필드명 정규화
    const list = extractLhList(raw).map(normalizeLhItem);

    if (list.length === 0) {
      console.log('lh_api: 응답은 받았으나 목록이 비어있음');
      console.log('응답 구조:', JSON.stringify(raw).slice(0, 300));
      return [];
    }

    console.log(`lh_api 성공: ${list.length}건`);
    return list;

  } catch (error) {
    const status = error.response?.status;
    const body   = error.response?.data;
    console.error(`lh_api 오류 (${status || 'network'}):`, error.message);
    if (body) console.log('응답 바디:', JSON.stringify(body).slice(0, 300));
    return null;
  }
};

// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// 서비스 15057999: 분양임대공고별 상세정보 조회
// 엔드포인트: https://apis.data.go.kr/B552555/lhLeaseNoticeDtlInfo1/getLeaseNoticeDtlInfo1
//
// 필수 파라미터 (목록 API 응답값 사용):
//   SPL_INF_TP_CD     — 공급정보구분코드 (예: 062)
//   CCR_CNNT_SYS_DS_CD — 연계시스템구분코드 (예: 03)
//   PAN_ID            — 공고아이디
//   UPP_AIS_TP_CD     — 상위매물유형코드
//   AIS_TP_CD         — 매물유형코드 (옵션)
// ──────────────────────────────────────────────────────────────
const LH_DETAIL_URL = 'https://apis.data.go.kr/B552555/lhLeaseNoticeDtlInfo1/getLeaseNoticeDtlInfo1';

const lh_detail_api = async (params) => {
  const {
    PAN_ID,
    SPL_INF_TP_CD,
    CCR_CNNT_SYS_DS_CD = '03',
    UPP_AIS_TP_CD,
    AIS_TP_CD,
  } = params;

  if (!LH_API_KEY) {
    console.warn('⚠ LH_API_KEY 없음');
    return null;
  }
  if (!PAN_ID) {
    console.warn('⚠ PAN_ID 필수');
    return null;
  }

  try {
    let paramStr = `serviceKey=${LH_API_KEY}&CCR_CNNT_SYS_DS_CD=${CCR_CNNT_SYS_DS_CD}&PAN_ID=${PAN_ID}`;
    if (SPL_INF_TP_CD)  paramStr += `&SPL_INF_TP_CD=${SPL_INF_TP_CD}`;
    if (UPP_AIS_TP_CD)  paramStr += `&UPP_AIS_TP_CD=${UPP_AIS_TP_CD}`;
    if (AIS_TP_CD)      paramStr += `&AIS_TP_CD=${AIS_TP_CD}`;

    const fullUrl = `${LH_DETAIL_URL}?${paramStr}`;
    console.log('lh_detail_api 호출:', fullUrl.slice(0, 90) + '...');

    const res = await axios.get(fullUrl, {
      timeout: 15000,
      headers: { Accept: 'application/json, text/xml, */*' },
    });

    const raw = res.data;
    if (isXmlError(raw)) {
      const errMsg = String(raw).match(/<errMsg>(.*?)<\/errMsg>/)?.[1];
      console.warn('lh_detail_api XML 오류:', errMsg);
      return null;
    }

    // 응답 구조: Array → 두 번째 요소에 실제 데이터
    if (Array.isArray(raw) && raw.length >= 2) {
      const dataObj = raw[1];
      const header  = dataObj?.resHeader?.[0];
      if (header?.SS_CODE !== 'Y') {
        console.warn('lh_detail_api SS_CODE 오류:', header);
        return null;
      }
      return dataObj;
    }

    return raw;
  } catch (error) {
    console.error('lh_detail_api 오류:', error.message);
    if (error.response) console.log('응답:', JSON.stringify(error.response.data).slice(0, 200));
    return null;
  }
};

// SH (서울주택도시공사) 청년 임대 공고 조회
//
// SH는 별도 공공 JSON API가 없습니다.
// i-sh.co.kr 게시판 엔드포인트를 시도하고, 실패 시 null 반환.
// 프런트에서 null 수신 시 SH 공식 사이트 안내 페이지를 표시합니다.
// ──────────────────────────────────────────────────────────────
const sh_api = async () => {
  try {
    const res = await axios.get(
      'https://www.i-sh.co.kr/app/lay2/program/S1T294C297/www/brd/m_247/viewBrdDataList.do',
      {
        params: { multi_itm_seq: 2, pageIndex: 1, pageUnit: 50 },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; YouthPolicyBot/1.0)',
          Accept: 'application/json, text/plain, */*',
        },
        timeout: 10000,
      }
    );

    const raw = res.data;
    // 응답이 배열이거나 list 키를 가진 객체
    let items = [];
    if (Array.isArray(raw)) {
      items = raw;
    } else if (raw?.list) {
      items = Array.isArray(raw.list) ? raw.list : [raw.list];
    } else if (raw?.datas) {
      items = Array.isArray(raw.datas) ? raw.datas : [raw.datas];
    }

    // '청년' 관련 공고만 필터
    const filtered = items.filter(
      (item) =>
        (item.ttl && item.ttl.includes('청년')) ||
        (item.title && item.title.includes('청년')) ||
        (item.TITLE && item.TITLE.includes('청년'))
    );

    console.log(`sh_api: 전체 ${items.length}건 → 청년 필터 후 ${filtered.length}건`);
    return filtered.length > 0 ? filtered : null;
  } catch (error) {
    // SH API 접근 불가 시 정상 fallback (프런트에서 안내 페이지 표시)
    console.log('sh_api Err (정상 fallback):', error.message);
    return null;
  }
};

const database = {
  news_api,
  job_api,
  residence_api,
  welfare_api,
  education_api,
  finance_api,
  lh_api,
  lh_detail_api,
  sh_api,
};

module.exports = { database };
