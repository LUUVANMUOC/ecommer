const DonHangShopModel = require('../../models/gianhang/donHangShopModel');
const ThongBaoDonHang = require('../../services/thongbao/thongBaoDonHang');

const MAX_BATCH = 100;

// Chuẩn hoá danh sách mã đơn: bỏ rỗng, bỏ trùng, giữ thứ tự gửi lên.
const chuanHoaDanhSach = (danh_sach) => {
  if (!Array.isArray(danh_sach)) return [];
  const daCo = new Set();
  const ketQua = [];
  for (const item of danh_sach) {
    const ma = String(typeof item === 'string' ? item : item?.DTS_Ma || '').trim();
    if (!ma || daCo.has(ma)) continue;
    daCo.add(ma);
    ketQua.push(ma);
  }
  return ketQua;
};

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

  // Xác nhận nhiều đơn cùng lúc: tất cả hoặc không.
  confirmOrdersBatch: async (req, res) => {
    try {
      const { gh_ma } = req.body;
      const ds = chuanHoaDanhSach(req.body.danh_sach);

      if (!gh_ma) throw new Error('Thiếu mã shop!');
      if (ds.length === 0) throw new Error('Vui lòng chọn ít nhất 1 đơn hàng!');
      if (ds.length > MAX_BATCH)
        throw new Error(`Chỉ xác nhận tối đa ${MAX_BATCH} đơn mỗi lần!`);

      // Model chạy 1 transaction cho cả lô -> hoặc tất cả thành công, hoặc không đơn nào đổi.
      await DonHangShopModel.confirmOrdersByShop(gh_ma, ds);

      // Đã COMMIT xong mới báo kho. Lỗi thông báo không làm hỏng việc xác nhận.
      const thongBao = await Promise.allSettled(
        ds.map((dts_ma) => ThongBaoDonHang.guiKhoLayHang(dts_ma)),
      );
      thongBao.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(
            `❌ Lỗi gửi thông báo kho lấy hàng cho ${ds[i]}:`,
            r.reason?.message,
          );
        }
      });

      res.json({
        message: `Đã xác nhận ${ds.length} đơn hàng thành công!`,
        tongSo: ds.length,
        danhSach: ds,
      });
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