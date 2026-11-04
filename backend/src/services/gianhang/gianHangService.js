const GianHangModel = require('../../models/gianhang/gianHangModel');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/shops');

const GianHangService = {
    getAll: async () => {
        return await GianHangModel.getAll();
    },

    update: async (id, data) => {
        const existing = await GianHangModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy gian hàng!');

        // Xóa ảnh cũ nếu có ảnh mới thay thế
        if (data.gh_hinhanh && existing.gh_hinhanh && data.gh_hinhanh !== existing.gh_hinhanh) {
            try {
                const fileName = path.basename(existing.gh_hinhanh);
                const filePath = path.join(UPLOAD_DIR, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[UPDATE] Đã xóa logo cũ: ${fileName}`);
                }
            } catch (error) {
                console.error("Lỗi khi xóa logo cũ:", error);
            }
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = {
            gh_ten: data.gh_ten,
            gh_mota: data.gh_mota || null,
            gh_hinhanh: data.gh_hinhanh || existing.gh_hinhanh || null,
            // BỔ SUNG: Dữ liệu địa chỉ để Model chạy Transaction
            dc_mota: data.dc_mota, 
            xa_ma: data.xa_ma
        };

        return await GianHangModel.update(id, updateData);
    },

    delete: async (id) => {
        const existing = await GianHangModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy gian hàng!');

        const deletedRecord = await GianHangModel.delete(id);

        // Xóa ảnh vật lý
        if (existing.gh_hinhanh) {
            try {
                const fileName = path.basename(existing.gh_hinhanh);
                const filePath = path.join(UPLOAD_DIR, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error("Lỗi khi xóa file ảnh:", error);
            }
        }
        return deletedRecord;
    }
};

module.exports = GianHangService;