// backend/src/services/san/maGiamGiaVanChuyenService.js
const MaGiamGiaVanChuyenModel = require('../../models/san/maGiamGiaVanChuyenModel');
const fs = require('fs');
const path = require('path');

const MaGiamGiaVanChuyenService = {
  getAll: async () => {
    return await MaGiamGiaVanChuyenModel.getAll();
  },

  getById: async (id) => {
    return await MaGiamGiaVanChuyenModel.getById(id);
  },

  create: async (data) => {
    return await MaGiamGiaVanChuyenModel.create(data);
  },

  update: async (id, data) => {
    const existing = await MaGiamGiaVanChuyenModel.getById(id);
    if (!existing) throw new Error("Không tìm thấy mã giảm giá vận chuyển!");

    if (data.MGG_VC_HinhAnh && existing.MGG_VC_HinhAnh && data.MGG_VC_HinhAnh !== existing.MGG_VC_HinhAnh) {
      try {
        const fileName = path.basename(existing.MGG_VC_HinhAnh);
        const filePath = path.join(__dirname, '../../public/uploads/vouchers', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error("Lỗi khi xóa ảnh cũ:", error);
      }
    }

    const updateData = {
      ...data,
      MGG_VC_HinhAnh: data.MGG_VC_HinhAnh || existing.MGG_VC_HinhAnh || null
    };

    return await MaGiamGiaVanChuyenModel.update(id, updateData);
  },

  delete: async (id) => {
    const existing = await MaGiamGiaVanChuyenModel.getById(id);
    if (!existing) throw new Error("Không tìm thấy mã giảm giá vận chuyển!");

    const deleted = await MaGiamGiaVanChuyenModel.delete(id);

    if (existing.MGG_VC_HinhAnh) {
      try {
        const fileName = path.basename(existing.MGG_VC_HinhAnh);
        const filePath = path.join(__dirname, '../../public/uploads/vouchers', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error("Lỗi khi xóa file ảnh:", error);
      }
    }

    return deleted;
  }
};

module.exports = MaGiamGiaVanChuyenService;