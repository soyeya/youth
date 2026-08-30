const mysql = require('mysql2');

let poolConfig;

if (process.env.MYSQL_URL) {
  // Railway 배포환경: MYSQL_URL = mysql://user:pass@host:port/dbname
  const u = new URL(process.env.MYSQL_URL);
  poolConfig = {
    host:     u.hostname,
    port:     Number(u.port) || 3306,
    user:     u.username,
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
  console.log('🚂 Railway MYSQL_URL 사용 →', u.hostname, ':', u.port);
} else {
  // 로컬 개발환경: .env 파일의 개별 항목 사용
  if (!process.env.DB_PASSWORD) {
    console.warn('⚠ 경고: DB_PASSWORD가 설정되지 않았습니다. .env 파일을 확인하세요.');
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

// 연결 테스트
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
