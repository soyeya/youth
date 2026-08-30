const mysql = require('mysql2');

// Railway MySQL이 제공하는 URL 변수명은 버전마다 다를 수 있음
// MYSQL_URL → DATABASE_URL → MYSQL_PRIVATE_URL → MYSQL_PUBLIC_URL 순서로 시도
const rawUrl =
  process.env.MYSQL_URL ||
  process.env.DATABASE_URL ||
  process.env.MYSQL_PRIVATE_URL ||
  process.env.MYSQL_PUBLIC_URL ||
  null;

let poolConfig;

if (rawUrl) {
  try {
    const u = new URL(rawUrl);
    poolConfig = {
      host:     u.hostname,
      port:     Number(u.port) || 3306,
      user:     decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
    console.log('🚂 Railway URL 방식 → host:', u.hostname, 'port:', u.port);
  } catch (e) {
    console.error('❌ DB URL 파싱 오류:', e.message);
  }
}

if (!poolConfig) {
  // 로컬 개발환경: .env의 개별 항목 사용
  if (!process.env.DB_PASSWORD) {
    console.warn('⚠ 경고: DB_PASSWORD 미설정. .env 파일을 확인하세요.');
  }
  poolConfig = {
    host:     process.env.DB_HOST || '127.0.0.1',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'youth',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const db = mysql.createPool(poolConfig);

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ DB 연결 실패:', err.message);
  } else {
    console.log('✅ DB 연결 성공');
    connection.release();
  }
});

const dataTable = { db };
module.exports = { dataTable };
