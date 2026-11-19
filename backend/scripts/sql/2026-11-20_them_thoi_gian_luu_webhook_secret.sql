-- Mốc thời gian lưu webhook secret, để trang cài đặt hiển thị "đã lưu lúc ...".
-- Chạy 1 lần trên Supabase (SQL Editor) hoặc bằng psql:
--   psql "$DATABASE_URL" -f backend/scripts/sql/2026-11-20_them_thoi_gian_luu_webhook_secret.sql
--
-- An toàn để chạy nhiều lần (IF NOT EXISTS) và không ảnh hưởng dữ liệu cũ.

ALTER TABLE thongtinnhantien_gianhang
    ADD COLUMN IF NOT EXISTS sepay_webhook_secret_saved_at timestamptz;

ALTER TABLE thongtinnhantien_dvvc
    ADD COLUMN IF NOT EXISTS sepay_webhook_secret_saved_at timestamptz;

-- Tuỳ chọn: đánh dấu các secret đã có sẵn (tạo trước khi có cột này).
-- Bỏ comment nếu muốn hiển thị "đã lưu lúc <bây giờ>" cho dữ liệu cũ.
-- UPDATE thongtinnhantien_gianhang
--    SET sepay_webhook_secret_saved_at = now()
--  WHERE sepay_webhook_secret IS NOT NULL
--    AND sepay_webhook_secret_saved_at IS NULL;
--
-- UPDATE thongtinnhantien_dvvc
--    SET sepay_webhook_secret_saved_at = now()
--  WHERE sepay_webhook_secret IS NOT NULL
--    AND sepay_webhook_secret_saved_at IS NULL;
