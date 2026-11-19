const PhanCongGiaoHangModel = require('../../models/quanlykho/phanCongGiaoHangModel');

const MAX_BATCH = 100;

const normalizeDanhSach = (danh_sach_dts) => {
  if (!Array.isArray(danh_sach_dts)) return [];
  return [...new Set(danh_sach_dts.map((ma) => String(ma || '').trim()).filter(Boolean))];
};

const PhanCongGiaoHangService = {
  getDonChoPhanCong: async (kho_ma) => {
    return await PhanCongGiaoHangModel.getDonChoPhanCong(kho_ma);
  },

  getShippersLSP03: async (kho_ma) => {
    return await PhanCongGiaoHangModel.getShippersLSP03(kho_ma);
  },

  phanCongGiaoHang: async (dts_ma, shipper_ma) => {
    if (!dts_ma || !shipper_ma) throw new Error("Thiếu thông tin phân công!");
    return await PhanCongGiaoHangModel.phanCongGiaoHang(dts_ma, shipper_ma);
  },

  // Phân công LSP03 hàng loạt: mỗi đơn 1 transaction riêng (model cũ đã có BEGIN/COMMIT + check trùng)
  phanCongGiaoHangBatch: async (shipper_ma, danh_sach_dts) => {
    if (!shipper_ma) throw new Error("Vui lòng chọn shipper!");
    const ds = normalizeDanhSach(danh_sach_dts);
    if (ds.length === 0) throw new Error("Vui lòng chọn ít nhất 1 đơn hàng!");
    if (ds.length > MAX_BATCH) throw new Error(`Chỉ phân công tối đa ${MAX_BATCH} đơn mỗi lần!`);

    const ketQua = [];
    for (const dts_ma of ds) {
      try {
        await PhanCongGiaoHangModel.phanCongGiaoHang(dts_ma, shipper_ma);
        ketQua.push({ dts_ma, ok: true });
      } catch (error) {
        ketQua.push({ dts_ma, ok: false, ly_do: error.message });
      }
    }

    const thanhCong = ketQua.filter((r) => r.ok).length;
    return { tongSo: ds.length, thanhCong, boQua: ds.length - thanhCong, ketQua };
  }
};

module.exports = PhanCongGiaoHangService;
