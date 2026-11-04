const ShipperModel = require('../../models/dvvc/shipperModel');
const bcrypt = require('bcryptjs');
const path = require('path');

const VALID_LSP = ['LSP01', 'LSP02', 'LSP03'];

const ShipperService = {
  getAllByDVVC: async (dvvc_ma) => {
    return await ShipperModel.getAllByDVVC(dvvc_ma);
  },

  create: async (data) => {
    // 0. Validate loại shipper
    if (!data.Lsp_Ma || !VALID_LSP.includes(data.Lsp_Ma)) {
      throw new Error('Loại shipper không hợp lệ!');
    }

    // 1. Tự sinh mã shipper (SHP + 7 chữ số)
    let newMa = 'SHP0000001';
    const latestMa = await ShipperModel.getLatestMa();
    if (latestMa) {
      const currentNumber = parseInt(latestMa.replace('SHP', ''), 10);
      newMa = 'SHP' + (currentNumber + 1).toString().padStart(7, '0');
    }

    // 2. Tự sinh mật khẩu ngẫu nhiên (6 ký tự IN HOA)
    const plainPassword = Math.random().toString(36).slice(-6).toUpperCase();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const newData = {
      Shipper_Ma: newMa,
      Shipper_Ten: data.Shipper_Ten,
      Shipper_SDT: data.Shipper_SDT,
      Shipper_HinhAnh: data.Shipper_HinhAnh || null,
      Shipper_GioiTinh: data.Shipper_GioiTinh === 'true' || data.Shipper_GioiTinh === true,
      Shipper_NgaySinh: data.Shipper_NgaySinh,
      Kho_Ma: data.Kho_Ma,
      Shipper_HashPass: hashedPassword,
      Lsp_Ma: data.Lsp_Ma
    };

    const createdShipper = await ShipperModel.create(newData);

    return { ...createdShipper, PlainPassword: plainPassword };
  },

  update: async (shipper_ma, data, file) => {
    let newImagePath = null;
    if (file) {
      newImagePath = `/uploads/shippers/${file.filename}`;
    }

    const updateData = {
      Shipper_Ten: data.Shipper_Ten,
      Shipper_SDT: data.Shipper_SDT,
      Shipper_GioiTinh: data.Shipper_GioiTinh === 'true' || data.Shipper_GioiTinh === true,
      Shipper_NgaySinh: data.Shipper_NgaySinh,
      Kho_Ma: data.Kho_Ma,
      Shipper_HinhAnh: newImagePath
      // ⚠️ Không có Lsp_Ma — theo yêu cầu không cho đổi
    };

    return await ShipperModel.update(shipper_ma, updateData);
  },

  delete: async (shipper_ma) => {
    return await ShipperModel.delete(shipper_ma);
  }
};

module.exports = ShipperService;