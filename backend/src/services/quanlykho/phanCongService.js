const QLKPhanCongModel = require('../../models/quanlykho/phanCongModel');

const MAX_BATCH = 100;

const normalizeDanhSach = (danh_sach_dts) => {
  if (!Array.isArray(danh_sach_dts)) return [];
  return [...new Set(danh_sach_dts.map((ma) => String(ma || '').trim()).filter(Boolean))];
};

const QLKPhanCongService = {
  getPendingOrders: async (kho_ma) => {
    return await QLKPhanCongModel.getPendingOrders(kho_ma);
  },

  getShippersByKho: async (kho_ma) => {
    return await QLKPhanCongModel.getShippersByKho(kho_ma);
  },

  assignShipper: async (dts_ma, shipper_ma) => {
    if (!dts_ma || !shipper_ma) throw new Error("Thiếu thông tin phân công!");
    const result = await QLKPhanCongModel.assignShipper(dts_ma, shipper_ma);
    if (!result) throw new Error("Đơn hàng đã được phân công hoặc không còn chờ lấy hàng!");
    return result;
  },

  // Phân công LSP01 hàng loạt: chạy tuần tự từng đơn, 1 đơn lỗi không ảnh hưởng đơn khác
  assignShipperBatch: async (shipper_ma, danh_sach_dts) => {
    if (!shipper_ma) throw new Error("Vui lòng chọn shipper!");
    const ds = normalizeDanhSach(danh_sach_dts);
    if (ds.length === 0) throw new Error("Vui lòng chọn ít nhất 1 đơn hàng!");
    if (ds.length > MAX_BATCH) throw new Error(`Chỉ phân công tối đa ${MAX_BATCH} đơn mỗi lần!`);

    const ketQua = [];
    for (const dts_ma of ds) {
      try {
        const row = await QLKPhanCongModel.assignShipper(dts_ma, shipper_ma);
        ketQua.push(
          row
            ? { dts_ma, ok: true }
            : { dts_ma, ok: false, ly_do: "Đơn đã được phân công hoặc không còn chờ lấy hàng" }
        );
      } catch (error) {
        ketQua.push({ dts_ma, ok: false, ly_do: error.message });
      }
    }

    const thanhCong = ketQua.filter((r) => r.ok).length;
    return { tongSo: ds.length, thanhCong, boQua: ds.length - thanhCong, ketQua };
  }
};

module.exports = QLKPhanCongService;
