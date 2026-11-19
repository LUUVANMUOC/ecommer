// backend/src/config/secretSavedAt.js
//
// Ghi mốc thời gian "đã lưu webhook secret" để hiển thị cho người dùng.
// Cột `sepay_webhook_secret_saved_at` cần được thêm bằng migration:
//   backend/scripts/sql/2026-11-20_them_thoi_gian_luu_webhook_secret.sql
// Nếu migration chưa chạy, hàm chỉ cảnh báo 1 lần rồi bỏ qua (không làm hỏng luồng lưu).
'use strict';

const MA_LOI_THIEU_COT = '42703'; // PostgreSQL: undefined_column

let daCanhBao = false;

/**
 * @param {(sql: string, params?: any[]) => Promise<any>} run hàm query (pool.query hoặc client.query)
 * @param {'thongtinnhantien_gianhang'|'thongtinnhantien_dvvc'} bang
 * @param {'gh_ma'|'dvvc_ma'} cotKhoa
 * @param {string} giaTri
 */
const danhDauDaLuu = async (run, bang, cotKhoa, giaTri) => {
  try {
    await run(
      `UPDATE ${bang} SET sepay_webhook_secret_saved_at = now() WHERE ${cotKhoa} = $1`,
      [giaTri]
    );
  } catch (error) {
    if (error.code === MA_LOI_THIEU_COT) {
      if (!daCanhBao) {
        daCanhBao = true;
        console.warn(
          '[secretSavedAt] Chưa có cột sepay_webhook_secret_saved_at — ' +
            'chạy file SQL trong backend/scripts/sql để hiện thời điểm lưu secret.'
        );
      }
      return;
    }
    throw error;
  }
};

module.exports = { danhDauDaLuu };
