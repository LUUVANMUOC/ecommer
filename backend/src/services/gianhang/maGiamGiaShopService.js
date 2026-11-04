// backend/src/services/gianhang/maGiamGiaShopService.js
const MaGiamGiaShopModel = require('../../models/gianhang/maGiamGiaShopModel');
const fs = require('fs');
const path = require('path');

const MaGiamGiaShopService = {
  getAllByShop: async (gh_ma) => {
    return await MaGiamGiaShopModel.getAllByShop(gh_ma);
  },

  getById: async (id) => {
    return await MaGiamGiaShopModel.getById(id);
  },

  create: async (data) => {
    return await MaGiamGiaShopModel.create(data);
  },

  update: async (id, data) => {
    const existing = await MaGiamGiaShopModel.getById(id);
    if (!existing) throw new Error("Không tìm thấy mã giảm giá của Shop!");

    // Xử lý xóa ảnh cũ nếu có ảnh mới
    if (data.MGG_Shop_HinhAnh && existing.MGG_Shop_HinhAnh && data.MGG_Shop_HinhAnh !== existing.MGG_Shop_HinhAnh) {
      try {
        const fileName = path.basename(existing.MGG_Shop_HinhAnh);
        const filePath = path.join(__dirname, '../../../public/uploads/vouchers', fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Lỗi khi xóa ảnh cũ:", error);
      }
    }

    const updateData = {
      ...data,
      MGG_Shop_HinhAnh: data.MGG_Shop_HinhAnh || existing.MGG_Shop_HinhAnh || null
    };

    return await MaGiamGiaShopModel.update(id, updateData);
  },

  delete: async (id) => {
    const existing = await MaGiamGiaShopModel.getById(id);
    if (!existing) throw new Error("Không tìm thấy mã giảm giá của Shop!");

    const deleted = await MaGiamGiaShopModel.delete(id);

    // Xóa file vật lý
    if (existing.MGG_Shop_HinhAnh) {
      try {
        const fileName = path.basename(existing.MGG_Shop_HinhAnh);
        const filePath = path.join(__dirname, '../../../public/uploads/vouchers', fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Lỗi khi xóa file ảnh:", error);
      }
    }

    return deleted;
  }
};

module.exports = MaGiamGiaShopService;