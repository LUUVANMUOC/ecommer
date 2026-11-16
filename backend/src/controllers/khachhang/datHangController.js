const DatHangService = require('../../services/khachhang/datHangService');
const ThongBaoDonHang = require('../../services/thongbao/thongBaoDonHang');

const DatHangController = {
  createOrder: async (req, res) => {
    try {
      const payload = req.body;
      if (!payload.kh_ma || !payload.ttnh_ma || !payload.orders || payload.orders.length === 0) {
        return res.status(400).json({ message: "Thiếu thông tin đặt hàng." });
      }

      const result = await DatHangService.createOrder(payload);

      // Đơn đã COMMIT xong mới báo shop, lỗi thông báo không làm hỏng đơn
      try {
        await ThongBaoDonHang.guiShopMoi({
          dm_ma: result.dm_ma,
          shops: result.shops || [],
        });
      } catch (thongBaoError) {
        console.error('❌ Lỗi gửi thông báo đơn mới cho shop:', thongBaoError.message);
      }

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = DatHangController;