const QLKShipperModel = require('../../models/quanlykho/shipperModel');
const bcrypt = require('bcryptjs');

const VALID_LSP = ['LSP01', 'LSP02', 'LSP03'];

const QLKShipperService = {
  getAllByKho: async (kho_ma) => {
    return await QLKShipperModel.getAllByKho(kho_ma);
  },

  create: async (data, kho_ma) => {
    // 0. Validate
    if (!kho_ma) throw new Error('Thiếu mã kho!');
    if (!data.Lsp_Ma || !VALID_LSP.includes(data.Lsp_Ma)) {
      throw new Error('Loại shipper không hợp lệ!');
    }

    // 1. Sinh mã SHP
    let newMa = 'SHP0000001';
    const latestMa = await QLKShipperModel.getLatestMa();
    if (latestMa) {
      const currentNumber = parseInt(latestMa.replace('SHP', ''), 10);
      newMa = 'SHP' + (currentNumber + 1).toString().padStart(7, '0');
    }

    // 2. Sinh password random 6 ký tự + hash
    const plainPassword = Math.random().toString(36).slice(-6).toUpperCase();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const newData = {
      Shipper_Ma: newMa,
      Shipper_Ten: data.Shipper_Ten,
      Shipper_SDT: data.Shipper_SDT,
      Shipper_HinhAnh: data.Shipper_HinhAnh || null,
      Shipper_GioiTinh:
        data.Shipper_GioiTinh === 'true' || data.Shipper_GioiTinh === true,
      Shipper_NgaySinh: data.Shipper_NgaySinh,
      Kho_Ma: kho_ma, // ← Gán kho từ user đang login
      Shipper_HashPass: hashedPassword,
      Lsp_Ma: data.Lsp_Ma,
    };

    const created = await QLKShipperModel.create(newData);
    return { ...created, PlainPassword: plainPassword };
  },

  update: async (shipper_ma, kho_ma, data, file) => {
    // 1. Check shipper thuộc kho của user
    const existing = await QLKShipperModel.findById(shipper_ma);
    if (!existing) throw new Error('Không tìm thấy shipper!');
    if (existing.kho_ma !== kho_ma) {
      throw new Error('Bạn không có quyền sửa shipper này!');
    }

    // 2. Build data
    const newImagePath = file ? `/uploads/shippers/${file.filename}` : null;
    const updateData = {
      Shipper_Ten: data.Shipper_Ten,
      Shipper_SDT: data.Shipper_SDT,
      Shipper_GioiTinh:
        data.Shipper_GioiTinh === 'true' || data.Shipper_GioiTinh === true,
      Shipper_NgaySinh: data.Shipper_NgaySinh,
      Shipper_HinhAnh: newImagePath,
    };

    return await QLKShipperModel.update(shipper_ma, updateData);
  },

  delete: async (shipper_ma, kho_ma) => {
    const existing = await QLKShipperModel.findById(shipper_ma);
    if (!existing) throw new Error('Không tìm thấy shipper!');
    if (existing.kho_ma !== kho_ma) {
      throw new Error('Bạn không có quyền xóa shipper này!');
    }
    return await QLKShipperModel.delete(shipper_ma);
  },
};

module.exports = QLKShipperService;