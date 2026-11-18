const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ⚠️ Trên Render (KHÔNG có IPv6), tuyệt đối không dùng host trực tiếp
//    "db.<project_ref>.supabase.co" (IPv6-only) -> sẽ lỗi AggregateError rỗng.
//    Dùng Connection Pooler:
//      Session pooler     : aws-0-<region>.pooler.supabase.com:5432  (khuyến nghị)
//      Transaction pooler : aws-0-<region>.pooler.supabase.com:6543  (+ ?pgbouncer=true)
//    User: postgres.<project_ref>
const coDatabaseUrl = Boolean(process.env.DATABASE_URL);

const poolConfig = coDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: Number(process.env.DB_PORT || 5432),
      ssl: { rejectUnauthorized: false },
    };

poolConfig.max = Number(process.env.DB_POOL_MAX || 10);
poolConfig.connectionTimeoutMillis = Number(process.env.DB_CONNECT_TIMEOUT_MS || 15000);
poolConfig.idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS || 30000);
poolConfig.query_timeout = Number(process.env.DB_QUERY_TIMEOUT_MS || 60000);
poolConfig.keepAlive = true;
poolConfig.keepAliveInitialDelayMillis = 10000;

// Chỉ in host:port, không in mật khẩu
const hostHienThi = () => {
  const u = process.env.DATABASE_URL;
  if (u) {
    const m = String(u).match(/@([^:/?]+)(?::(\d+))?/);
    return m ? `${m[1]}:${m[2] || '5432'}` : '(DATABASE_URL không hợp lệ)';
  }
  return `${process.env.DB_HOST || '(chưa cấu hình)'}:${process.env.DB_PORT || '5432'}`;
};

// In được cả lỗi thường lẫn AggregateError (message rỗng)
const moTaLoi = (err) => {
  if (!err) return 'không rõ lỗi';
  const phan = [];
  if (err.code) phan.push(`code=${err.code}`);
  if (err.message) phan.push(err.message);
  if (err.detail) phan.push(`detail=${err.detail}`);
  if (err.hint) phan.push(`hint=${err.hint}`);
  if (Array.isArray(err.errors) && err.errors.length) {
    err.errors.forEach((e, i) => {
      phan.push(`[${i}] ${[e.code, e.message, e.syscall].filter(Boolean).join(' ')}`);
    });
  }
  if (!phan.length) phan.push(err.stack || String(err));
  return phan.join(' | ');
};

console.log(`🔥 DB: ${coDatabaseUrl ? 'DATABASE_URL' : 'các biến rời'} -> ${hostHienThi()}`);

const pool = new Pool(poolConfig);

pool.on('connect', () => console.log('✅ Kết nối PostgreSQL thành công!'));

pool.on('error', (err) => console.error('❌ Lỗi pool Database:', moTaLoi(err)));

pool.moTaLoi = moTaLoi;

module.exports = pool;