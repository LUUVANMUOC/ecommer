-- Webhook secret cho Sàn: cho phép admin Sàn nhập secret ngay trên giao diện
-- thay vì phải sửa .env / chạy script mã hoá thủ công.
-- Chạy 1 lần trên Supabase (SQL Editor) hoặc bằng psql.
-- Không xoá dữ liệu, an toàn khi chạy lại.

ALTER TABLE thongtinnhantien_stmdt
    ADD COLUMN IF NOT EXISTS sepay_webhook_secret character varying(255);

ALTER TABLE thongtinnhantien_stmdt
    ADD COLUMN IF NOT EXISTS sepay_webhook_secret_saved_at timestamp with time zone;
