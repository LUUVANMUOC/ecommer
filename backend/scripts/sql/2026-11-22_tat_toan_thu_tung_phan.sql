-- Tất toán thu từng phần: mỗi QR là một khoản thu độc lập.
-- Chạy 1 lần trên Supabase (SQL Editor) hoặc bằng psql.
--
-- Thay đổi:
--   1. Cho phép QR / phiếu tất toán ở trạng thái HUY.
--      QR đã thu (DA_THANH_TOAN) không bao giờ bị xoá khi huỷ phiếu.
--   2. Thêm index cho các truy vấn đối soát phần đã thu / còn phải thu.
-- Không xoá dữ liệu, không thêm bảng.

ALTER TABLE qr_thanh_toan
    DROP CONSTRAINT IF EXISTS qr_thanh_toan_qr_trang_thai_check;

ALTER TABLE qr_thanh_toan
    ADD CONSTRAINT qr_thanh_toan_qr_trang_thai_check
    CHECK (qr_trang_thai IN ('CHUA_THANH_TOAN', 'DA_THANH_TOAN', 'HUY'));

ALTER TABLE phieu_tat_toan
    DROP CONSTRAINT IF EXISTS phieu_tat_toan_ptt_trang_thai_thanh_toan_check;

ALTER TABLE phieu_tat_toan
    ADD CONSTRAINT phieu_tat_toan_ptt_trang_thai_thanh_toan_check
    CHECK (ptt_trang_thai_thanh_toan IN ('CHO_THANH_TOAN', 'DA_THANH_TOAN', 'HUY'));

CREATE INDEX IF NOT EXISTS idx_chitiet_tat_toan_dts_ma
    ON chitiet_tat_toan (dts_ma);

CREATE INDEX IF NOT EXISTS idx_qr_thanh_toan_ptt_ma
    ON qr_thanh_toan (ptt_ma);

CREATE INDEX IF NOT EXISTS idx_qr_thanh_toan_loai_trang_thai
    ON qr_thanh_toan (qr_loai, qr_trang_thai);

CREATE INDEX IF NOT EXISTS idx_phieu_tat_toan_kho_trang_thai
    ON phieu_tat_toan (kho_ma, ptt_trang_thai_thanh_toan);
