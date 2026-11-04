// backend/src/services/maGiamGiaSanService.js
const MaGiamGiaSanModel = require('../../models/san/maGiamGiaSanModel');
const fs = require('fs');
const path = require('path');

const MaGiamGiaSanService = {
  getAll: async () => {
    return await MaGiamGiaSanModel.getAll();
  },

  getById: async (id) => {
    return await MaGiamGiaSanModel.getById(id);
  },

  create: async (data) => {
    return await MaGiamGiaSanModel.create(data);
  },

  update: async (id, data) => {
    const existing = await MaGiamGiaSanModel.getById(id);
    if (!existing) throw new Error("Không tìm thấy mã giảm giá!");

    // Xử lý xóa ảnh cũ nếu có ảnh mới được upload lên
    if (data.MGG_San_HinhAnh && existing.MGG_San_HinhAnh && data.MGG_San_HinhAnh !== existing.MGG_San_HinhAnh) {
      try {
        const fileName = path.basename(existing.MGG_San_HinhAnh);
        const filePath = path.join(__dirname, '../../public/uploads/vouchers', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[UPDATE] Đã xóa ảnh cũ: ${fileName}`);
        }
      } catch (error) {
        console.error("Lỗi khi xóa ảnh cũ:", error);
      }
    }

    // Giữ lại ảnh cũ nếu không có ảnh mới (ĐÃ SỬA LỖI VIẾT HOA)
    const updateData = {
      ...data,
      MGG_San_HinhAnh: data.MGG_San_HinhAnh || existing.MGG_San_HinhAnh || null
    };

    return await MaGiamGiaSanModel.update(id, updateData);
  },

  delete: async (id) => {
    const existing = await MaGiamGiaSanModel.getById(id);
    if (!existing) throw new Error("Không tìm thấy mã giảm giá!");

    // Xóa trong DB trước
    const deleted = await MaGiamGiaSanModel.delete(id);

    // Xóa file vật lý (ĐÃ SỬA LỖI VIẾT HOA)
    if (existing.MGG_San_HinhAnh) {
      try {
        const fileName = path.basename(existing.MGG_San_HinhAnh);
        const filePath = path.join(__dirname, '../../public/uploads/vouchers', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[DELETE] Đã xóa file ảnh: ${fileName}`);
        }
      } catch (error) {
        console.error("Lỗi khi xóa file ảnh:", error);
      }
    }

    return deleted;
  }
};

module.exports = MaGiamGiaSanService;