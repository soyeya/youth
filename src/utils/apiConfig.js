// API 베이스 URL 설정
// 개발 환경: setupProxy.js를 통해 http://localhost:3400 으로 프록시됨
// 프로덕션: REACT_APP_API_URL 환경변수로 백엔드 서버 주소 설정 가능
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3400';

export default API_BASE;
