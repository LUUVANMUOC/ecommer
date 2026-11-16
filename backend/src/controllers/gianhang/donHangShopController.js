const DonHangShopModel = require('../../models/gianhang/donHangShopModel');
const ThongBaoDonHang = require('../../services/thongbao/thongBaoDonHang');

const DonHangShopController = {
  getOrders: async (req, res) => {
    try {
      const data = await DonHangShopModel.getOrdersByShop(req.params.gh_ma);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getOrderDetail: async (req, res) => {
    try {
      const data = await DonHangShopModel.getOrderDetailByShop(req.params.dts_ma);
      if (!data) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  confirmOrder: async (req, res) => {
    try {
      const result = await DonHangShopModel.confirmOrder(req.params.dts_ma);

      // Đơn đã COMMIT sang TTDH02 -> báo kho phụ trách đi lấy hàng.
      // Lỗi thông báo không được làm hỏng việc xác nhận đơn.
      try {
        await ThongBaoDonHang.guiKhoLayHang(req.params.dts_ma);
      } catch (thongBaoError) {
        console.error('❌ Lỗi gửi thông báo kho lấy hàng:', thongBaoError.message);
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  phanHoiDanhGia: async (req, res) => {
    try {
      const { dts_ma, ctsp_ma, kh_ma, phanhoi } = req.body;
      const result = await DonHangShopModel.phanHoiDanhGia(dts_ma, ctsp_ma, kh_ma, phanhoi);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = DonHangShopController;