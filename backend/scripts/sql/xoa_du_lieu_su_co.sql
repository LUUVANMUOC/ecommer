-- Xoá TOÀN BỘ dữ liệu phát sinh của nghiệp vụ "xử lý sự cố" để tạo lại từ đầu.
--
-- Dùng khi muốn reset sạch: phiếu sự cố, lịch sử trạng thái, trách nhiệm,
-- minh chứng, khoản hoàn tiền, QR nhận tiền, tiền giữ hộ, thông báo sự cố.
--
-- KHÔNG xoá danh mục: loaisuco, trangthaixulysuco, loaisuco_chuthe...
-- KHÔNG đụng tới đơn hàng, người dùng, tài khoản nhận tiền.
--
-- Chạy trên Supabase SQL Editor hoặc:
--   psql "$DATABASE_URL" -f backend/scripts/sql/xoa_du_lieu_su_co.sql
--
-- ⚠️ Ảnh/PDF minh chứng nằm ở backend/public/uploads/suco KHÔNG bị xoá bởi SQL.
--    Dùng script node để xoá kèm:  node scripts/xoaDuLieuSuCo.js --xoa --xoa-tep
--
-- An toàn: toàn bộ nằm trong 1 transaction, lỗi sẽ tự ROLLBACK.

BEGIN;

-- 1. Bảng con trước, bảng cha sau (tránh vi phạm khoá ngoại).
DELETE FROM qr_hoan_tien;          -- QR nhận tiền (FK -> hoantien)
DELETE FROM hoantien;              -- Khoản hoàn tiền / bồi thường
DELETE FROM giu_tien_su_co;        -- Tiền giữ hộ của sự cố
DELETE FROM chitiettrangthaisuco;  -- Lịch sử trạng thái phiếu
DELETE FROM chiutrachnhiemsuco;    -- Trách nhiệm các bên
DELETE FROM minhchungsuco;         -- Tệp minh chứng
DELETE FROM yeucauxulysuco;        -- Phiếu yêu cầu xử lý sự cố

-- 2. Thông báo phát sinh từ sự cố (người nhận xoá theo cascade).
DELETE FROM thongbao
 WHERE tb_nguon_ma = 'SU_CO'
    OR tb_doituong_loai = 'SU_CO'
    OR tb_nhom = 'SU_CO'
    OR tb_link LIKE '%/su-co/%';

-- 3. Đưa khoá tự tăng của bảng tiền giữ hộ về 1.
ALTER SEQUENCE IF EXISTS giu_tien_su_co_gtsc_id_seq RESTART WITH 1;

COMMIT;

-- 4. Kiểm tra lại (tất cả phải bằng 0).
SELECT 'yeucauxulysuco'        AS bang, count(*) AS con_lai FROM yeucauxulysuco
UNION ALL SELECT 'chitiettrangthaisuco', count(*) FROM chitiettrangthaisuco
UNION ALL SELECT 'chiutrachnhiemsuco',   count(*) FROM chiutrachnhiemsuco
UNION ALL SELECT 'minhchungsuco',        count(*) FROM minhchungsuco
UNION ALL SELECT 'hoantien',             count(*) FROM hoantien
UNION ALL SELECT 'qr_hoan_tien',         count(*) FROM qr_hoan_tien
UNION ALL SELECT 'giu_tien_su_co',       count(*) FROM giu_tien_su_co
UNION ALL SELECT 'thongbao (su co)',     count(*) FROM thongbao
 WHERE tb_nguon_ma = 'SU_CO'
    OR tb_doituong_loai = 'SU_CO'
    OR tb_nhom = 'SU_CO'
    OR tb_link LIKE '%/su-co/%';
