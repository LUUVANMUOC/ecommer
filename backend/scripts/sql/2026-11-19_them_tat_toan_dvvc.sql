-- Tất toán cước vận chuyển từ kho cho ĐVVC.
-- Chạy 1 lần trên Supabase (SQL Editor) hoặc bằng psql:
--   psql "$DATABASE_URL" -f backend/scripts/sql/2026-11-19_them_tat_toan_dvvc.sql
--
-- Các cột tiền của ĐVVC đã có sẵn trong DB:
--   phieu_tat_toan.ptt_tong_tien_dvvc
--   chitiet_tat_toan.ctt_tien_dvvc
--   qr_thanh_toan.qr_loai = 'DVVC' + qr_thanh_toan.dvvc_ma
-- Migration này chỉ bổ sung cột phân loại phiếu và bật lại constraint (nếu thiếu).
--
-- An toàn để chạy nhiều lần (IF NOT EXISTS) và không ảnh hưởng dữ liệu cũ.

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

-- Đảm bảo CHECK của qr_loai cho phép 'DVVC' (bỏ qua nếu constraint đã đúng).
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
