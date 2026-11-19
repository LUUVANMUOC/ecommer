-- Tất toán cước vận chuyển từ kho cho ĐVVC.
-- Chạy 1 lần trên Supabase (SQL Editor) hoặc bằng psql:
--   psql "$DATABASE_URL" -f backend/scripts/sql/2026-11-19_them_tat_toan_dvvc.sql
--
-- Vì sao cần migration này:
--   DB cũ (production/Supabase) mới chỉ có phần tất toán Shop + Sàn.
--   Tính năng "kho tất toán cước cho ĐVVC" cần thêm các cột/constraint sau.
--   DB localhost của máy dev có thể đã có sẵn một phần -> IF NOT EXISTS bỏ qua.
--
-- An toàn để chạy nhiều lần (IF NOT EXISTS) và không ảnh hưởng dữ liệu cũ:
--   các cột tiền mặc định 0 nên phiếu cũ vẫn đọc bình thường.

-- 1. Tổng cước ĐVVC của phiếu tất toán
ALTER TABLE phieu_tat_toan
    ADD COLUMN IF NOT EXISTS ptt_tong_tien_dvvc numeric NOT NULL DEFAULT 0;

-- 2. Cước ĐVVC của từng đơn trong phiếu
ALTER TABLE chitiet_tat_toan
    ADD COLUMN IF NOT EXISTS ctt_tien_dvvc numeric NOT NULL DEFAULT 0;

-- 3. Mã ĐVVC nhận tiền của QR tất toán cước
ALTER TABLE qr_thanh_toan
    ADD COLUMN IF NOT EXISTS dvvc_ma varchar(10);

-- 4. Phân loại phiếu: DAY_DU (tất toán Shop/Sàn/ĐVVC) | CUOC_TON (chỉ cước tồn)
ALTER TABLE phieu_tat_toan
    ADD COLUMN IF NOT EXISTS ptt_loai varchar(20) NOT NULL DEFAULT 'DAY_DU';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'phieu_tat_toan_ptt_loai_check'
    ) THEN
        ALTER TABLE phieu_tat_toan
            ADD CONSTRAINT phieu_tat_toan_ptt_loai_check
            CHECK (ptt_loai IN ('DAY_DU', 'CUOC_TON'));
    END IF;
END $$;

-- 5. Cho phép qr_loai = 'DVVC'
--    Constraint cũ chỉ cho SAN/SHOP -> phải drop rồi tạo lại.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'qr_thanh_toan_qr_loai_check'
          AND pg_get_constraintdef(oid) NOT LIKE '%DVVC%'
    ) THEN
        ALTER TABLE qr_thanh_toan DROP CONSTRAINT qr_thanh_toan_qr_loai_check;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'qr_thanh_toan_qr_loai_check'
    ) THEN
        ALTER TABLE qr_thanh_toan
            ADD CONSTRAINT qr_thanh_toan_qr_loai_check
            CHECK (qr_loai IN ('SAN', 'SHOP', 'DVVC'));
    END IF;
END $$;
