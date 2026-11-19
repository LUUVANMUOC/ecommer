const ShipperTrungChuyenModel = require('../../models/shipper/trungChuyenModel');

const MAX_BATCH = 100;

const layTenFile = (file) => `/uploads/trungchuyen/${file.filename}`;

const ShipperTrungChuyenService = {
  getDonDangTrungChuyen: async (shipper_ma) => {
    return await ShipperTrungChuyenModel.getDonDangTrungChuyen(shipper_ma);
  },

  getLichSu: async (shipper_ma) => {
    return await ShipperTrungChuyenModel.getLichSu(shipper_ma);
  },

  giaoHangToiKho: async (dts_ma, shipper_ma, file, ghichu) => {
    if (!file) throw new Error("Bắt buộc phải có ảnh minh chứng giao tới kho!");
    const hinhanhPath = layTenFile(file);
    
    const result = await ShipperTrungChuyenModel.giaoHangToiKho(dts_ma, shipper_ma, hinhanhPath, ghichu);
    if (!result) throw new Error("Đơn hàng không tồn tại hoặc đã được giao rồi!");
    return result;
  },

  // Giao hàng loạt về CÙNG một kho đích, dùng chung 1 ảnh minh chứng.
  // Mỗi đơn 1 transaction riêng (model đã có BEGIN/COMMIT + guard chống giao trùng).
  giaoHangToiKhoBatch: async (danh_sach, shipper_ma, file, ghichu) => {
    if (!file) throw new Error("Bắt buộc phải có ảnh minh chứng giao tới kho!");

    const daCo = new Set();
    const ds = [];
    for (const item of Array.isArray(danh_sach) ? danh_sach : []) {
      const dts_ma = String(typeof item === 'string' ? item : item?.dts_ma || item?.DTS_Ma || '').trim();
      if (!dts_ma || daCo.has(dts_ma)) continue;
      daCo.add(dts_ma);
      ds.push(dts_ma);
    }

    if (ds.length === 0) throw new Error("Vui lòng chọn ít nhất 1 đơn hàng!");
    if (ds.length > MAX_BATCH) throw new Error(`Chỉ giao tối đa ${MAX_BATCH} đơn mỗi lần!`);

    const dangDi = await ShipperTrungChuyenModel.getDonDangTrungChuyen(shipper_ma);
    const theoDon = new Map(dangDi.map((o) => [o.DTS_Ma, o]));

    const thieu = ds.filter((dts_ma) => !theoDon.has(dts_ma));
    if (thieu.length > 0) {
      throw new Error(`Đơn không còn chờ giao: ${thieu.slice(0, 3).join(', ')}${thieu.length > 3 ? '...' : ''}`);
    }

    const cacKhoDich = new Set(ds.map((dts_ma) => theoDon.get(dts_ma).Kho_Den_Ma));
    if (cacKhoDich.size > 1) {
      throw new Error("Chỉ giao hàng loạt cho các đơn cùng một kho đích!");
    }

    const hinhanhPath = layTenFile(file);
    const ketQua = [];
    for (const dts_ma of ds) {
      try {
        await ShipperTrungChuyenModel.giaoHangToiKho(dts_ma, shipper_ma, hinhanhPath, ghichu);
        ketQua.push({ dts_ma, ok: true });
      } catch (error) {
        ketQua.push({ dts_ma, ok: false, ly_do: error.message });
      }
    }

    const thanhCong = ketQua.filter((r) => r.ok).length;
    return {
      tongSo: ds.length,
      thanhCong,
      boQua: ds.length - thanhCong,
      kho_den_ma: [...cacKhoDich][0],
      ketQua,
    };
  }
};

module.exports = ShipperTrungChuyenService;
