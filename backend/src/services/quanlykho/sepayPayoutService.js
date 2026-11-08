const axios = require('axios');
const pool = require('../../config/db');

const SepayPayoutService = {
  callSePayTransfer: async (bankCode, accountNumber, amount, content) => {
    try {
      const payload = {
        bank_account_id: process.env.SEPAY_BA_XID, 
        to_bank_code: bankCode, 
        to_account_number: accountNumber,
        amount: Math.round(amount),
        content: content.substring(0, 50)
      };

      console.log(`   📤 Đang gọi SePay Payout tới STK: ${accountNumber} (Ngân hàng: ${bankCode})`);

      const response = await axios.post(
        'https://userapi.sepay.vn/v2/transfers',
        payload,
        { headers: { 'Authorization': `Bearer ${process.env.SEPAY_API_TOKEN}` } }
      );

      return { success: true, transactionId: response.data.id || response.data.transaction_id };
    } catch (error) {
      // 🟢 IN CHI TIẾT LỖI TỪ SEPAY RA TERMINAL
      const errorMsg = error.response?.data?.message || error.message;
      console.error(`   ❌ Lỗi SePay Payout cho STK ${accountNumber}:`, errorMsg);
      return { success: false, message: errorMsg };
    }
  },

  payoutChoShop: async () => {
    // Dùng LEFT JOIN để lấy cả những shop chưa cấu hình ngân hàng (để báo lỗi)
    const res = await pool.query(`
      SELECT s.ma_doi_tuong as gh_ma, s.so_du, 
             t.ttnt_gianhang_sotaikhoan as so_tk, 
             n.nhg_ma as bank_code
      FROM so_du_noi_bo s
      LEFT JOIN thongtinnhantien_gianhang t ON s.ma_doi_tuong = t.gh_ma
      LEFT JOIN nganhang n ON t.nh_ma = n.nhg_ma
      WHERE s.loai_doi_tuong = 'SHOP' AND s.so_du > 0
    `);

    let ketQua = [];
    for (const shop of res.rows) {
      // Kiểm tra nếu thiếu thông tin ngân hàng
      if (!shop.so_tk || !shop.bank_code) {
        console.log(`   ⚠️ Bỏ qua Shop ${shop.gh_ma}: Chưa cấu hình STK hoặc Ngân hàng.`);
        ketQua.push({ gh_ma: shop.gh_ma, success: false, message: 'Thiếu STK/Ngân hàng' });
        continue;
      }

      const noiDung = `Tat toan so du shop ${shop.gh_ma}`;
      const kq = await SepayPayoutService.callSePayTransfer(
        shop.bank_code, 
        shop.so_tk, 
        shop.so_du, 
        noiDung
      );

      if (kq.success) {
        await pool.query(`UPDATE so_du_noi_bo SET so_du = 0 WHERE ma_doi_tuong = $1 AND loai_doi_tuong = 'SHOP'`, [shop.gh_ma]);
        await pool.query(`INSERT INTO lich_su_chi_tra (ma_doi_tuong, loai_doi_tuong, so_tien, noi_dung, sepay_transaction_id, trang_thai) VALUES ($1, 'SHOP', $2, $3, $4, 'THANH_CONG')`, [shop.gh_ma, shop.so_du, noiDung, kq.transactionId]);
      } else {
        await pool.query(`INSERT INTO lich_su_chi_tra (ma_doi_tuong, loai_doi_tuong, so_tien, noi_dung, trang_thai) VALUES ($1, 'SHOP', $2, $3, 'THAT_BAI')`, [shop.gh_ma, shop.so_du, noiDung]);
      }
      ketQua.push({ gh_ma: shop.gh_ma, ...kq });
    }
    return ketQua;
  }
};

module.exports = SepayPayoutService;