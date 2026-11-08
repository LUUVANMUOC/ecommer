const pool = require('../../config/db');
const SepayPayoutService = require('../../services/quanlykho/sepayPayoutService');

const QuanLyDongTienController = {
  // Lấy danh sách ví các Shop
    getViShop: async (req, res) => {
    try {
      const query = `
        SELECT 
          s.ma_doi_tuong as gh_ma, 
          g.gh_ten as ten_shop, 
          s.so_du, 
          t.ttnt_gianhang_sotaikhoan as so_tai_khoan, 
          n.nhg_ten as ten_ngan_hang
        FROM so_du_noi_bo s
        JOIN gianhang g ON s.ma_doi_tuong = g.gh_ma
        LEFT JOIN thongtinnhantien_gianhang t ON g.gh_ma = t.gh_ma
        LEFT JOIN nganhang n ON t.nh_ma = n.nhg_ma
        WHERE s.loai_doi_tuong = 'SHOP' AND s.so_du > 0
      `;
      const result = await pool.query(query);
      
      // 🟢 THÊM DÒNG LOG NÀY ĐỂ XEM KẾT QUẢ
      console.log("👉 Dữ liệu Ví Shop trả về Frontend:", result.rows);
      
      res.status(200).json(result.rows);
    } catch (error) {
      // 🟢 IN LỖI RA MÀN HÌNH ĐEN NẾU CÂU SQL BỊ SAI
      console.error("❌ Lỗi SQL lấy ví Shop:", error.message); 
      res.status(500).json({ message: error.message });
    }
  },

  // Thực hiện Payout
  payoutShop: async (req, res) => {
    try {
      const ketQua = await SepayPayoutService.payoutChoShop();
      const thanhCong = ketQua.filter(k => k.success).length;
      res.status(200).json({ thanhCong, chiTiet: ketQua });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  xacNhanDaTra: async (req, res) => {
    const { danhSachGhMa } = req.body; // Mảng các mã shop đã được admin chuyển khoản thủ công
    if (!danhSachGhMa || danhSachGhMa.length === 0) {
      return res.status(400).json({ message: "Không có shop nào được chọn" });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const gh_ma of danhSachGhMa) {
        // 1. Lấy số dư hiện tại để ghi log
        const resVi = await client.query(
          `SELECT so_du FROM so_du_noi_bo WHERE ma_doi_tuong = $1 AND loai_doi_tuong = 'SHOP'`,
          [gh_ma]
        );
        
        const soDuHienTai = resVi.rows[0]?.so_du || 0;

        if (soDuHienTai > 0) {
          // 2. Ghi vào lịch sử chi trả (để lưu vết kế toán)
          await client.query(
            `INSERT INTO lich_su_chi_tra (ma_doi_tuong, loai_doi_tuong, so_tien, noi_dung, trang_thai) 
             VALUES ($1, 'SHOP', $2, $3, 'THANH_CONG')`,
            [gh_ma, soDuHienTai, `Admin xác nhận chuyển khoản thủ công`]
          );

          // 3. Đưa số dư về 0
          await client.query(
            `UPDATE so_du_noi_bo SET so_du = 0 WHERE ma_doi_tuong = $1 AND loai_doi_tuong = 'SHOP'`,
            [gh_ma]
          );
        }
      }

      await client.query('COMMIT');
      res.status(200).json({ message: 'Đã cập nhật trạng thái chi trả thành công!' });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ message: error.message });
    } finally {
      client.release();
    }
  }
};

module.exports = QuanLyDongTienController;