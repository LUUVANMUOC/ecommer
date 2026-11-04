// backend/src/controllers/maGiamGiaSanController.js
const MaGiamGiaSanService = require('../../services/san/maGiamGiaSanService');
const fs = require('fs');
const path = require('path');

// Đường dẫn thư mục chứa ảnh voucher
const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/vouchers');

const MaGiamGiaSanController = {
  getAll: async (req, res) => {
    try {
      const data = await MaGiamGiaSanService.getAll();
      res.status(200).json(data);
    } catch (error) {
      console.error("LỖI GET ALL MÃ GIẢM GIÁ:", error);
      res.status(500).json({ 
        message: "Lỗi server khi lấy danh sách", 
        chi_tiet_loi: error.message 
      });
    }
  },

  getById: async (req, res) => {
    try {
      const data = await MaGiamGiaSanService.getById(req.params.id);
      if (!data) return res.status(404).json({ message: "Không tìm thấy" });
      res.status(200).json(data);
    } catch (error) {
      console.error("LỖI GET BY ID:", error);
      res.status(500).json({ message: "Lỗi server", chi_tiet_loi: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = { ...req.body };

      // Nếu có file được upload lên
      if (req.file) {
        data.MGG_San_HinhAnh = `/uploads/vouchers/${req.file.filename}`;
      }

      const newData = await MaGiamGiaSanService.create(data);
      res.status(201).json(newData);
    } catch (error) {
      console.error("LỖI CREATE MÃ GIẢM GIÁ:", error);
      res.status(400).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const id = req.params.id;
      const data = { ...req.body };

      // 1. Lấy thông tin cũ từ Database để kiểm tra ảnh cũ
      const existing = await MaGiamGiaSanService.getById(id);
      if (!existing) {
        return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
      }

      // 2. Nếu có up ảnh mới
      if (req.file) {
        data.MGG_San_HinhAnh = `/uploads/vouchers/${req.file.filename}`;

        // 3. Xóa file ảnh cũ trong thư mục vật lý (nếu có)
        if (existing.MGG_San_HinhAnh) {
          try {
            const oldFileName = path.basename(existing.MGG_San_HinhAnh);
            const oldFilePath = path.join(UPLOAD_DIR, oldFileName);

            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
              console.log(`[UPDATE] Đã xóa ảnh cũ: ${oldFileName}`);
            }
          } catch (fsError) {
            console.error("Lỗi khi xóa file ảnh cũ:", fsError);
            // Không throw error ở đây để tránh việc cập nhật DB bị hủy chỉ vì lỗi xóa file
          }
        }
      }

      const updatedData = await MaGiamGiaSanService.update(id, data);
      res.status(200).json(updatedData);
    } catch (error) {
      console.error("LỖI UPDATE MÃ GIẢM GIÁ:", error);
      res.status(400).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.params.id;

      // 1. Lấy thông tin cũ để lấy đường dẫn ảnh
      const existing = await MaGiamGiaSanService.getById(id);

      // 2. Gọi Service xóa trong Database
      await MaGiamGiaSanService.delete(id);

      // 3. Xóa file ảnh vật lý
      if (existing && existing.MGG_San_HinhAnh) {
        try {
          const fileName = path.basename(existing.MGG_San_HinhAnh);
          const filePath = path.join(UPLOAD_DIR, fileName);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[DELETE] Đã xóa file ảnh: ${fileName}`);
          }
        } catch (fsError) {
          console.error("Lỗi khi xóa file ảnh:", fsError);
        }
      }

      res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
      console.error("LỖI DELETE MÃ GIẢM GIÁ:", error);
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = MaGiamGiaSanController;