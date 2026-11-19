const TrungChuyenModel = require('../../models/quanlykho/trungChuyenModel');

const MAX_BATCH = 100;

const TrungChuyenService = {
  getDonChoGui: async (kho_di_ma) => {
    return await TrungChuyenModel.getDonChoGui(kho_di_ma);
  },

  getShippersLSP02: async (kho_di_ma) => {
    return await TrungChuyenModel.getShippersLSP02(kho_di_ma);
  },

  guiTrungChuyen: async (data) => {
    if (!data.dts_ma || !data.shipper_trungchuyen_ma) {
      throw new Error("Thiếu thông tin gửi trung chuyển!");
    }
    return await TrungChuyenModel.guiTrungChuyen(data);
  },

  // Gửi trung chuyển hàng loạt: mỗi đơn 1 transaction riêng (model đã có BEGIN/COMMIT + guard chống trùng)
  guiTrungChuyenBatch: async (kho_di_ma, shipper_trungchuyen_ma, danh_sach) => {
    if (!kho_di_ma || !shipper_trungchuyen_ma) {
      throw new Error("Vui lòng chọn shipper trung chuyển!");
    }
    if (!Array.isArray(danh_sach)) throw new Error("Vui lòng chọn ít nhất 1 đơn hàng!");

    const daCo = new Set();
    const ds = [];
    for (const item of danh_sach) {
      const dts_ma = String(item?.dts_ma || "").trim();
      if (!dts_ma || daCo.has(dts_ma)) continue;
      daCo.add(dts_ma);
      ds.push({ dts_ma, kho_den_ma: item?.kho_den_ma || null });
    }

    if (ds.length === 0) throw new Error("Vui lòng chọn ít nhất 1 đơn hàng!");
    if (ds.length > MAX_BATCH) throw new Error(`Chỉ gửi tối đa ${MAX_BATCH} đơn mỗi lần!`);

    const ketQua = [];
    for (const item of ds) {
      try {
        if (!item.kho_den_ma) throw new Error("Không xác định được kho đích");
        await TrungChuyenModel.guiTrungChuyen({
          dts_ma: item.dts_ma,
          shipper_trungchuyen_ma,
          kho_di_ma,
          kho_den_ma: item.kho_den_ma,
        });
        ketQua.push({ dts_ma: item.dts_ma, ok: true });
      } catch (error) {
        ketQua.push({ dts_ma: item.dts_ma, ok: false, ly_do: error.message });
      }
    }

    const thanhCong = ketQua.filter((r) => r.ok).length;
    return { tongSo: ds.length, thanhCong, boQua: ds.length - thanhCong, ketQua };
  },

  getDonChoNhan: async (kho_den_ma) => {
    return await TrungChuyenModel.getDonChoNhan(kho_den_ma);
  },

  nhanHang: async (dts_ma, kho_den_ma) => {
    const result = await TrungChuyenModel.nhanHang(dts_ma, kho_den_ma);
    if (!result) {
      throw new Error("Đơn hàng không tồn tại hoặc đã được nhận trước đó!");
    }
    return result;
  }
};

module.exports = TrungChuyenService;