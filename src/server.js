// .env 파일 로드 (반드시 다른 require보다 먼저)
require('dotenv').config();

const express = require('express');
const crypto = require('crypto'); // Node.js 내장 모듈 — 별도 설치 불필요
const cors = require('cors');

// nodemailer — 이메일 인증 (npm install nodemailer 필요)
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch { console.warn('nodemailer 미설치 — 이메일 인증 비활성화'); }

/** 이메일 인증 코드 저장소 (인메모리, TTL 5분) */
const emailCodeStore = new Map(); // key: email, value: { code, expiresAt, verified }
const emailSendCooldown = new Map(); // key: email, value: lastSendTime (rate-limit)

/** nodemailer transporter (환경변수 설정 시 활성화) */
function getMailer() {
  if (!nodemailer) return null;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PW;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}
const app = express();
const PORT = process.env.PORT || 3400;
const server = require('http').createServer(app);
const { database } = require('./api/board.js');
const { dataTable } = require('./lib/db.js');

// CORS: 로컬 개발 + GitHub Pages + Railway 프로덕션 모두 허용
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat([
    'http://localhost:3000',
    'http://localhost:3400',
    'https://soyeya.github.io',
  ]);
app.use(cors({
  origin: function (origin, callback) {
    // origin이 없으면 모바일 앱·Postman 등 — 허용
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return callback(null, true);
    callback(new Error('CORS: 허용되지 않은 origin — ' + origin));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ──────────────────────────────────────────────────────────────
// 비밀번호 해싱 유틸 (Node.js 내장 crypto.scrypt 사용)
// bcrypt와 동일한 보안 수준, 외부 패키지 불필요
// ──────────────────────────────────────────────────────────────

/** 비밀번호 해시 생성 → "salt:hash" 형태로 반환 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/** 비밀번호 검증 (해시와 비교) */
function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false; // 구형 평문 비밀번호 → 불일치 처리
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * 하위 호환 비밀번호 검증
 * DB에 평문으로 저장된 기존 계정도 로그인 가능하게 처리 (마이그레이션 기간)
 * 로그인 성공 시 자동으로 해시로 업그레이드
 */
async function verifyAndMigratePassword(inputPw, storedPw, userId, promisePool) {
  // 1) 해시 형식이면 scrypt 검증
  if (storedPw.includes(':')) {
    return verifyPassword(inputPw, storedPw);
  }
  // 2) 평문 형식(구형 계정)이면 단순 비교 후 해시로 업그레이드
  if (inputPw === storedPw) {
    const newHash = hashPassword(inputPw);
    await promisePool.query('UPDATE Login SET userPassword = ? WHERE userId = ?', [newHash, userId]);
    console.log(`계정 ${userId} 비밀번호 해시로 자동 업그레이드 완료`);
    return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────
// 찜 목록 유틸
// ──────────────────────────────────────────────────────────────

/** 구버전 프런트는 [userId, section, link, title] 배열로 전송하므로 둘 다 허용 */
function normalizeWishlistBody(body) {
  if (Array.isArray(body)) {
    return {
      userId: body[0], section: body[1], link: body[2],
      title: body[3], applyEnd: body[4] || null, banknm: null,
    };
  }
  const { userId, section, link, title, applyEnd, banknm } = body || {};
  return {
    userId, section: section || null, link: link || null,
    title, applyEnd: applyEnd || null, banknm: banknm || null,
  };
}

/** 찜 목록 스키마 자동 마이그레이션 (applyEnd, banknm) */
async function ensureWishlistSchema() {
  const db = dataTable.db.promise();
  const cols = [
    { col: 'applyEnd', def: "ALTER TABLE MyList ADD COLUMN applyEnd VARCHAR(20) NULL" },
    { col: 'banknm',   def: "ALTER TABLE MyList ADD COLUMN banknm VARCHAR(100) NULL" },
  ];
  for (const { col, def } of cols) {
    try {
      await db.query(def);
      console.log(`MyList.${col} 컬럼 추가 완료`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log(`MyList.${col} 스키마 오류:`, err.message);
    }
  }
}

/** Login 테이블에 이름·이메일 컬럼 추가 (없는 경우에만) */
async function ensureLoginSchema() {
  const db = dataTable.db.promise();
  const cols = [
    { col: 'userName',  def: "ALTER TABLE Login ADD COLUMN userName VARCHAR(50) NULL" },
    { col: 'userEmail', def: "ALTER TABLE Login ADD COLUMN userEmail VARCHAR(100) NULL" },
  ];
  for (const { col, def } of cols) {
    try {
      await db.query(def);
      console.log(`Login.${col} 컬럼 추가 완료`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log(`Login.${col} 스키마 오류:`, err.message);
    }
  }
}

// ── 라우트 ────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json('Youth Policy API Server is running');
});

/* newsApi */
app.get('/newsApi', async (req, res) => {
  try {
    const data = await database.news_api();
    if (data) return res.status(200).send(data);
    res.status(503).json({ error: 'API 데이터를 가져올 수 없습니다' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* jobApi */
app.post('/jobApi', async (req, res) => {
  try {
    const data = await database.job_api(req.body);
    if (data) return res.status(200).send(data);
    res.status(503).json({ error: 'API 데이터를 가져올 수 없습니다' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* residenceApi */
app.get('/residenceApi', async (req, res) => {
  try {
    const data = await database.residence_api();
    if (data) return res.status(200).send(data);
    res.status(503).json({ error: 'API 데이터를 가져올 수 없습니다' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* welfareApi */
app.get('/welfareApi', async (req, res) => {
  try {
    const data = await database.welfare_api();
    if (data) return res.status(200).send(data);
    res.status(503).json({ error: 'API 데이터를 가져올 수 없습니다' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* educationApi */
app.get('/educationApi', async (req, res) => {
  try {
    const data = await database.education_api();
    if (data) return res.status(200).send(data);
    res.status(503).json({ error: 'API 데이터를 가져올 수 없습니다' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* financeApi */
app.post('/financeApi', async (req, res) => {
  try {
    const data = await database.finance_api(req.body);
    if (data) return res.status(200).send(data);
    res.status(503).json({ error: '금융 API 데이터를 가져올 수 없습니다' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 아이디 중복 확인 */
app.get('/checkId', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId 필수' });
  const promisePool = dataTable.db.promise();
  try {
    const [rows] = await promisePool.query('SELECT userId FROM Login WHERE userId = ?', [userId]);
    res.json({ available: rows.length === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 이메일 인증 코드 전송 */
app.post('/sendVerifyEmail', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '유효하지 않은 이메일입니다' });
  }

  // 전송 cooldown: 60초
  const last = emailSendCooldown.get(email) || 0;
  if (Date.now() - last < 60_000) {
    return res.status(429).json({ error: '잠시 후 다시 시도해주세요 (60초 대기)' });
  }

  // 이메일 발송이 불가한 경우 (환경변수 미설정) → format 검증만 통과
  const mailer = getMailer();
  if (!mailer) {
    // 메일러 미설정 시 코드 없이 'skip' 응답 — 개발 환경용
    emailCodeStore.set(email, { code: 'SKIP', expiresAt: Date.now() + 300_000, verified: true });
    return res.json({ ok: true, skipped: true, message: '이메일 서버 미설정 — 인증 자동 통과' });
  }

  // 6자리 랜덤 코드 생성
  const code = String(crypto.randomInt(100000, 999999));
  emailCodeStore.set(email, { code, expiresAt: Date.now() + 300_000, verified: false });
  emailSendCooldown.set(email, Date.now());

  try {
    await mailer.sendMail({
      from: `"청년 정책 알리미" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '[청년 정책 알리미] 이메일 인증 코드',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #dde3ee;border-radius:12px">
          <h2 style="color:#174283;margin-bottom:8px">이메일 인증</h2>
          <p style="color:#555;margin-bottom:24px">아래 인증 코드를 입력해 주세요. <strong>5분</strong> 내에 입력하세요.</p>
          <div style="background:#f4f8ff;border:1.5px solid #174283;border-radius:8px;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#174283">${code}</div>
          <p style="color:#aaa;font-size:12px;margin-top:20px">본인이 요청하지 않은 경우 이 메일을 무시하세요.</p>
        </div>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('이메일 전송 오류:', err.message);
    emailCodeStore.delete(email);
    res.status(500).json({ error: '이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

/* 이메일 인증 코드 확인 */
app.post('/verifyEmailCode', (req, res) => {
  const { email, code } = req.body;
  const entry = emailCodeStore.get(email);
  if (!entry) return res.status(400).json({ error: '인증 코드를 먼저 요청해주세요' });
  if (Date.now() > entry.expiresAt) {
    emailCodeStore.delete(email);
    return res.status(400).json({ error: '인증 코드가 만료되었습니다. 다시 요청해주세요.' });
  }
  if (entry.code === 'SKIP' || entry.code === code) {
    entry.verified = true;
    return res.json({ ok: true });
  }
  return res.status(400).json({ error: '인증 코드가 일치하지 않습니다' });
});

/* 회원가입 — 비밀번호 해시 저장 */
app.post('/join', async (req, res) => {
  const { userId, userPassword, userName, userEmail } = req.body;
  if (!userId || !userPassword) return res.status(400).json({ error: '필수 항목 누락' });

  // 이메일 인증 확인
  if (userEmail) {
    const entry = emailCodeStore.get(userEmail);
    if (!entry || !entry.verified) {
      return res.status(400).json({ error: '이메일 인증이 완료되지 않았습니다' });
    }
  }

  const promisePool = dataTable.db.promise();
  try {
    const [existing] = await promisePool.query(
      'SELECT userId FROM Login WHERE userId = ?', [userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 아이디입니다' });
    }
    const hashedPassword = hashPassword(userPassword);
    const [result] = await promisePool.query(
      'INSERT INTO Login (userId, userPassword, userName, userEmail) VALUES(?, ?, ?, ?)',
      [userId, hashedPassword, userName || null, userEmail || null]
    );
    // 인증 코드 사용 완료 → 삭제
    if (userEmail) emailCodeStore.delete(userEmail);
    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    console.log('joinServer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* 로그인 — 해시 검증 + 평문 마이그레이션 */
app.post('/login', async (req, res) => {
  const [inputId, inputPw] = req.body;
  const promisePool = dataTable.db.promise();
  try {
    const [users] = await promisePool.query('SELECT * FROM Login');
    const user = users.find((u) => u.userId === inputId);

    if (!user) {
      return res.status(401).json({ error: '아이디가 존재하지 않습니다' });
    }

    const isValid = await verifyAndMigratePassword(
      inputPw, user.userPassword, inputId, promisePool
    );

    if (isValid) {
      // LoginList에 세션 기록
      await promisePool.query(
        'INSERT INTO LoginList(userId, userPassword) VALUES(?, ?)',
        [inputId, user.userPassword]
      );
      return res.status(200).json({ success: true, userId: inputId });
    }
    return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });
  } catch (err) {
    console.log('loginServer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* 로그인 상태 조회 */
app.get('/LoginList', async (req, res) => {
  const promisePool = dataTable.db.promise();
  try {
    const [data] = await promisePool.query('SELECT * FROM LoginList');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 찜 목록 저장 */
app.post('/MyList', async (req, res) => {
  const { userId, section, link, title, applyEnd } = normalizeWishlistBody(req.body);
  if (!userId || !title) {
    return res.status(400).json({ error: 'userId와 title은 필수입니다' });
  }
  const promisePool = dataTable.db.promise();
  try {
    const [existing] = await promisePool.query(
      'SELECT userId FROM MyList WHERE userId = ? AND title = ?', [userId, title]
    );
    if (existing.length > 0) return res.send('already');
    await promisePool.query(
      'INSERT INTO MyList (userId, section, link, title, applyEnd) VALUES(?,?,?,?,?)',
      [userId, section, link, title, applyEnd]
    );
    res.send('업로드성공');
  } catch (err) {
    console.log('MyListServer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* 찜 목록 조회 — userId 지정 시 해당 유저 항목만 반환 */
app.get('/MyList', async (req, res) => {
  const { userId } = req.query;
  const promisePool = dataTable.db.promise();
  try {
    const [data] = userId
      ? await promisePool.query('SELECT * FROM MyList WHERE userId = ?', [userId])
      : await promisePool.query('SELECT * FROM MyList');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 찜 목록 삭제 */
app.delete('/MyList', async (req, res) => {
  const { userId, title } = normalizeWishlistBody(req.body);
  if (!userId || !title) {
    return res.status(400).json({ error: 'userId와 title은 필수입니다' });
  }
  const promisePool = dataTable.db.promise();
  try {
    const [result] = await promisePool.query(
      'DELETE FROM MyList WHERE userId = ? AND title = ?',
      [userId, title]
    );
    res.json({ success: true, removed: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* 찜 항목 banknm 업데이트 (금융 상품 은행명 보완) */
app.patch('/MyList/banknm', async (req, res) => {
  const { userId, title, banknm } = req.body || {};
  if (!userId || !title || !banknm) {
    return res.status(400).json({ error: 'userId, title, banknm은 필수입니다' });
  }
  const promisePool = dataTable.db.promise();
  try {
    await promisePool.query(
      'UPDATE MyList SET banknm = ? WHERE userId = ? AND title = ? AND (banknm IS NULL OR banknm = "")',
      [banknm, userId, title]
    );
    res.json({ success: true });
  } catch (err) {
    console.log('MyList banknm 업데이트 오류:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* 내 정보 조회 */
app.get('/myInfo', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId 필수' });
  const promisePool = dataTable.db.promise();
  try {
    const [rows] = await promisePool.query(
      'SELECT userId, userName, userEmail FROM Login WHERE userId = ?', [userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 내 정보 수정 (이름, 이메일, 비밀번호) */
app.put('/myInfo', async (req, res) => {
  const { userId, currentPassword, userName, userEmail, newPassword } = req.body;
  if (!userId || !currentPassword) return res.status(400).json({ error: 'userId, currentPassword 필수' });

  const promisePool = dataTable.db.promise();
  try {
    const [users] = await promisePool.query('SELECT * FROM Login WHERE userId = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

    const isValid = await verifyAndMigratePassword(currentPassword, users[0].userPassword, userId, promisePool);
    if (!isValid) return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다' });

    // 이메일 변경 시 인증 확인
    if (userEmail && userEmail !== users[0].userEmail) {
      const entry = emailCodeStore.get(userEmail);
      if (!entry || !entry.verified) {
        return res.status(400).json({ error: '새 이메일 인증이 완료되지 않았습니다' });
      }
      emailCodeStore.delete(userEmail);
    }

    const fields = [];
    const values = [];
    if (userName !== undefined) { fields.push('userName = ?'); values.push(userName); }
    if (userEmail !== undefined) { fields.push('userEmail = ?'); values.push(userEmail); }
    if (newPassword) {
      const pwReg = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/;
      if (!pwReg.test(newPassword)) return res.status(400).json({ error: '비밀번호는 영문+숫자 조합 8~16자' });
      fields.push('userPassword = ?');
      values.push(hashPassword(newPassword));
    }
    if (fields.length === 0) return res.status(400).json({ error: '변경할 항목이 없습니다' });

    values.push(userId);
    await promisePool.query(`UPDATE Login SET ${fields.join(', ')} WHERE userId = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 회원 탈퇴 */
app.delete('/account', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: 'userId, password 필수' });

  const promisePool = dataTable.db.promise();
  try {
    const [users] = await promisePool.query('SELECT * FROM Login WHERE userId = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

    const isValid = await verifyAndMigratePassword(password, users[0].userPassword, userId, promisePool);
    if (!isValid) return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });

    // 관련 데이터 모두 삭제
    await promisePool.query('DELETE FROM MyList WHERE userId = ?', [userId]);
    await promisePool.query('DELETE FROM LoginList WHERE userId = ?', [userId]);
    await promisePool.query('DELETE FROM Login WHERE userId = ?', [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 로그아웃 */
app.post('/Logout', async (req, res) => {
  const promisePool = dataTable.db.promise();
  try {
    await promisePool.query('DELETE FROM LoginList WHERE userId = ?', [req.body[0]]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* lhApi — LH 청년 임대 공고 */
app.get('/lhApi', async (req, res) => {
  try {
    const data = await database.lh_api();
    if (data === null) {
      // null = API 키 미설정 또는 모든 엔드포인트 실패
      return res.status(200).json([]); // 빈 배열로 응답 (프런트에서 안내 처리)
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('lhApi 라우트 오류:', err.message);
    res.status(200).json([]); // 오류 시에도 빈 배열 반환 (프런트 안내 모드)
  }
});

/* shApi — SH 청년 임대 공고 */
app.get('/shApi', async (req, res) => {
  try {
    const data = await database.sh_api();
    // null = SH 공식 사이트 안내로 fallback (프런트에서 처리)
    return res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* lhDetailApi — LH 공고별 상세정보 조회 */
app.get('/lhDetailApi', async (req, res) => {
  try {
    const { panId, splInfTpCd, ccrCnntSysDsCd, uppAisTpCd, aisTpCd } = req.query;
    if (!panId) return res.status(400).json({ error: 'panId 필수' });

    const data = await database.lh_detail_api({
      PAN_ID:              panId,
      SPL_INF_TP_CD:       splInfTpCd,
      CCR_CNNT_SYS_DS_CD:  ccrCnntSysDsCd || '03',
      UPP_AIS_TP_CD:       uppAisTpCd,
      AIS_TP_CD:           aisTpCd,
    });

    if (!data) return res.status(503).json({ error: '상세 정보를 가져올 수 없습니다' });
    res.status(200).json(data);
  } catch (err) {
    console.error('lhDetailApi 오류:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* lhDiag — LH API 진단 (개발용, 배포 전 제거)
   서버 재시작 후 http://localhost:3400/lhDiag 로 접속 */
app.get('/lhDiag', async (req, res) => {
  const KEY = process.env.LH_API_KEY;
  if (!KEY) return res.json({ ok: false, msg: 'LH_API_KEY 없음' });

  const axios = require('axios');
  const BASE = 'https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1';
  // 공식 파라미터: PAGE(페이지번호), PG_SZ(결과수), ServiceKey(인증키)
  const endpoints = [
    // 서비스 15058530 — 분양임대공고문 조회 (목록 API)
    { label: '[15058530] /lhLeaseNoticeInfo1 ServiceKey 대문자',
      url: BASE + '/lhLeaseNoticeInfo1?ServiceKey=' + KEY + '&PAGE=1&PG_SZ=5' },
    { label: '[15058530] /lhLeaseNoticeInfo1 serviceKey 소문자',
      url: BASE + '/lhLeaseNoticeInfo1?serviceKey=' + KEY + '&PAGE=1&PG_SZ=5' },
    { label: '[15058530] /lhLeaseNoticeInfo1 + PAN_SS=공고중',
      url: BASE + '/lhLeaseNoticeInfo1?ServiceKey=' + KEY + '&PAGE=1&PG_SZ=5&PAN_SS=' + encodeURIComponent('공고중') },
    { label: '[15058530] /getLeaseNoticeInfo1',
      url: BASE + '/getLeaseNoticeInfo1?ServiceKey=' + KEY + '&PAGE=1&PG_SZ=5' },
    // 서비스 15057999 — 분양임대공고별 상세정보 조회 (상세 API, PAN_ID 필요)
    { label: '[15057999] lhLeaseNoticeDtlInfo1/getLeaseNoticeDtlInfo1',
      url: 'https://apis.data.go.kr/B552555/lhLeaseNoticeDtlInfo1/getLeaseNoticeDtlInfo1?serviceKey=' + KEY + '&PAGE=1&PG_SZ=5' },
  ];

  const results = [];
  for (var i = 0; i < endpoints.length; i++) {
    var ep = endpoints[i];
    try {
      var r = await axios.get(ep.url, { timeout: 8000 });
      var raw = r.data;
      var isXml = typeof raw === 'string' && raw.indexOf('<') !== -1;
      var xmlMatch = isXml ? raw.match(/<errMsg>(.*?)<\/errMsg>/) : null;
      var xmlErr = isXml ? (xmlMatch ? xmlMatch[1] : 'XML') : null;
      results.push({
        label: ep.label, status: r.status,
        ok: !isXml && !xmlErr, xmlErr: xmlErr,
        keys: !isXml ? Object.keys(raw || {}) : null,
        sample: isXml ? raw.slice(0, 200) : JSON.stringify(raw).slice(0, 200),
      });
    } catch (e) {
      var body = e.response && e.response.data;
      var hdr = body && body.OpenAPI_ServiceResponse && body.OpenAPI_ServiceResponse.cmmMsgHeader;
      results.push({
        label: ep.label,
        status: (e.response && e.response.status) || 'net',
        error: e.message,
        errMsg: hdr ? hdr.errMsg : String(body || '').slice(0, 80),
        ok: false,
      });
    }
  }

  var ok = results.filter(function(r) { return r.ok; });
  res.json({
    summary: ok.length
      ? ('SUCCESS: ' + ok.map(function(r) { return r.label; }).join(' | '))
      : 'FAIL — 아래 errMsg 확인 (403=키미등록, 400=경로없음)',
    keyPrefix: KEY.slice(0, 15) + '...',
    results: results,
  });
});

server.listen(PORT, async () => {
  console.log(`✅ 서버가 포트 ${PORT}로 실행 중입니다`);
  await ensureWishlistSchema();
  await ensureLoginSchema();
});
