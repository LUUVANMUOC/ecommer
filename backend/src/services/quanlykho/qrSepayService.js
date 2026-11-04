// src/services/quanlykho/qrSepayService.js
const { qrPrefix } = require('../../config/sepayConfig');

const QrSepayService = {
  /**
   * Tạo URL QR động từ thông tin ngân hàng
   * @param {Object} bank - { so_tai_khoan, nganhang_ten }
   * @param {number} amount - số tiền
   * @param {string} description - nội dung chuyển khoản (mã QR)
   * @returns {string} URL ảnh QR
   */
  buildQrUrl: (bank, amount, description) => {
    const acc = bank?.so_tai_khoan || bank?.ttnt_gianhang_sotaikhoan || bank?.ttnt_stmdt_sotaikhoan;
    const bankName = bank?.nganhang_ten || bank?.nhg_ten || bank?.NganHang_Ten;

    if (!acc) return null;

    const params = new URLSearchParams({
      acc,
      bank: bankName || 'Vietcombank',
    });

    if (amount && Number(amount) > 0) {
      params.set('amount', String(Math.floor(Number(amount))));
    }
    if (description) {
      params.set('des', description);
    }

    return `https://qr.sepay.vn/img?${params.toString()}`;
  },

  /**
   * Tạo mã QR cho phiếu tất toán
   * - QR Sàn:  TT{ptt_ma}S
   * - QR Shop: TT{ptt_ma}SH{gh_ma}
   */
  buildQrCode: (ptt_ma, loai, gh_ma = null) => {
    if (loai === 'SAN') return `${qrPrefix}${ptt_ma}S`;
    return `${qrPrefix}${ptt_ma}SH${gh_ma}`;
  },
};

module.exports = QrSepayService;