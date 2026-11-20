-- Thanh toán sự cố: QR nhận tiền cho từng khoản hoàn tiền/bồi thường.
-- Chạy 1 lần trên Supabase (SQL Editor) hoặc bằng psql:
--   psql "$DATABASE_URL" -f backend/scripts/sql/2026-11-21_them_thanh_toan_su_co.sql
--
-- An toàn để chạy nhiều lần, không ảnh hưởng dữ liệu cũ.

-- 1. QR của khoản hoàn tiền (mỗi khoản tối đa 1 QR đang mở).
CREATE TABLE IF NOT EXISTS qr_hoan_tien (
    qr_ma           varchar(20) PRIMARY KEY,
    ht_ma           varchar(10) NOT NULL UNIQUE
                        REFERENCES hoantien(ht_ma) ON DELETE CASCADE,
    qr_so_tien      numeric NOT NULL CHECK (qr_so_tien >= 0),
    qr_trang_thai   varchar(20) NOT NULL DEFAULT 'CHUA_THANH_TOAN',
    qr_ma_giao_dich varchar(100),
    qr_thoi_diem_tt timestamptz,
    qr_tao_luc      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT qr_hoan_tien_trang_thai_check
        CHECK (qr_trang_thai IN ('CHUA_THANH_TOAN', 'DA_THANH_TOAN', 'HUY'))
);

CREATE INDEX IF NOT EXISTS idx_qr_ht_trang_thai
    ON qr_hoan_tien (qr_trang_thai);

-- 2. Ghi nhận nguồn xác nhận: webhook ngân hàng hay admin xác nhận tay.
ALTER TABLE hoantien
    ADD COLUMN IF NOT EXISTS ht_nguon_xac_nhan varchar(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'ht_nguon_xac_nhan_check'
    ) THEN
        ALTER TABLE hoantien
            ADD CONSTRAINT ht_nguon_xac_nhan_check
            CHECK (
                ht_nguon_xac_nhan IS NULL
                OR ht_nguon_xac_nhan IN ('WEBHOOK', 'PAYOUT', 'THU_CONG')
            );
    END IF;
END $$;

-- 3. Cho phép phương thức thanh toán mới.
ALTER TABLE hoantien DROP CONSTRAINT IF EXISTS ht_phuong_thuc_check;
ALTER TABLE hoantien
    ADD CONSTRAINT ht_phuong_thuc_check
    CHECK (ht_phuong_thuc IN ('CHUYEN_KHOAN', 'VI_NOI_BO', 'QR', 'PAYOUT'));

-- 4. Bên chịu trách nhiệm bấm "Tôi đã chuyển khoản" (kèm minh chứng).
--    Chỉ ghi nhận để admin đối soát, KHÔNG tự đóng khoản chi.
ALTER TABLE hoantien
    ADD COLUMN IF NOT EXISTS ht_baochuyen_luc timestamptz;
ALTER TABLE hoantien
    ADD COLUMN IF NOT EXISTS ht_baochuyen_ghichu text;
