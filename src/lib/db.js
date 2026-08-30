const mysql = require('mysql2');

// DB 접속 정보는 .env 파일에서 로드 (절대 코드에 하드코딩하지 말 것)
const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'youth',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

if (!process.env.DB_PASSWORD) {
  console.warn('⚠ 경고: DB_PASSWORD가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

const dataTable = { db };
module.exports = { dataTable };
