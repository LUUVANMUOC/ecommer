// backend/src/controllers/gianhang/maGiamGiaShopController.js
const MaGiamGiaShopService = require('../../services/gianhang/maGiamGiaShopService');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/vouchers');

const MaGiamGiaShopController = {
  // GET /api/nguoi-ban/ma-giam-gia-shop/:gh_ma
  getAllByShop: async (req, res) => {
    try {
      const data = await MaGiamGiaShopService.getAllByShop(req.params.gh_ma);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: "Lỗi server khi lấy danh sách", error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const data = await MaGiamGiaShopService.getById(req.params.id);
      if (!data) return res.status(404).json({ message: "Không tìm thấy" });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.MGG_Shop_HinhAnh = `/uploads/vouchers/${req.file.filename}`;
      }
      const newData = await MaGiamGiaShopService.create(data);
      res.status(201).json(newData);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const id = req.params.id;
      const data = { ...req.body };

      const existing = await MaGiamGiaShopService.getById(id);
      if (!existing) return res.status(404).json({ message: "Không tìm thấy mã" });

      if (req.file) {
        data.MGG_Shop_HinhAnh = `/uploads/vouchers/${req.file.filename}`;
        
        if (existing.MGG_Shop_HinhAnh) {
          try {
            const oldFileName = path.basename(existing.MGG_Shop_HinhAnh);
            const oldFilePath = path.join(UPLOAD_DIR, oldFileName);
            if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
          } catch (fsError) {
            console.error("Lỗi khi xóa file ảnh cũ:", fsError);
          }
        }
      }

      const updatedData = await MaGiamGiaShopService.update(id, data);
      res.status(200).json(updatedData);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.params.id;
      const existing = await MaGiamGiaShopService.getById(id);

      await MaGiamGiaShopService.delete(id);

      if (existing && existing.MGG_Shop_HinhAnh) {
        try {
          const fileName = path.basename(existing.MGG_Shop_HinhAnh);
          const filePath = path.join(UPLOAD_DIR, fileName);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (fsError) {
          console.error("Lỗi khi xóa file ảnh:", fsError);
        }
      }
      res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = MaGiamGiaShopController;