const ThuocTinhSanPhamModel = require('../../models/san/thuocTinhSanPhamModel');
const fs = require('fs'); 
const path = require('path'); 

// Đường dẫn lưu ảnh (Lùi 3 cấp từ src/services/san để ra backend, vào public/uploads/attributes)
const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/attributes');

const ThuocTinhSanPhamService = {
    getAll: async () => {
        return await ThuocTinhSanPhamModel.getAll();
    },

    getById: async (id) => {
        const item = await ThuocTinhSanPhamModel.getById(id);
        if (!item) throw new Error('Không tìm thấy thuộc tính này!');
        return item;
    },

    create: async (data) => {
        let newMa = 'THSP01'; 
        const latestMa = await ThuocTinhSanPhamModel.getLatestMa();
        
        if (latestMa) {
            const currentNumber = parseInt(latestMa.substring(4), 10); // Cắt bỏ 'THSP'
            const nextNumber = currentNumber + 1;
            newMa = 'THSP' + nextNumber.toString().padStart(2, '0');
        }

        const newData = {
            thsp_ma: newMa,
            thsp_ten: data.thsp_ten,
            thsp_mota: data.thsp_mota || null,
            thsp_icon: data.thsp_icon || null
        };

        return await ThuocTinhSanPhamModel.create(newData);
    },

    update: async (id, data) => {
        const existing = await ThuocTinhSanPhamModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy thuộc tính để cập nhật!');
        
        // Xử lý xóa ảnh cũ nếu có ảnh mới thay thế
        if (data.thsp_icon && existing.thsp_icon && data.thsp_icon !== existing.thsp_icon) {
            try {
                const fileName = path.basename(existing.thsp_icon);
                const filePath = path.join(UPLOAD_DIR, fileName);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[UPDATE] Đã xóa icon cũ: ${fileName}`);
                }
            } catch (error) {
                console.error("Lỗi khi xóa icon cũ:", error);
            }
        }

        const updateData = {
            thsp_ten: data.thsp_ten,
            thsp_mota: data.thsp_mota || null,
            thsp_icon: data.thsp_icon || existing.thsp_icon || null
        };

        return await ThuocTinhSanPhamModel.update(id, updateData);
    },

    delete: async (id) => {
        const existing = await ThuocTinhSanPhamModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy thuộc tính để xóa!');
        
        const deletedRecord = await ThuocTinhSanPhamModel.delete(id);

        // Xóa file vật lý
        if (existing.thsp_icon) {
            try {
                const fileName = path.basename(existing.thsp_icon);
                const filePath = path.join(UPLOAD_DIR, fileName);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[DELETE] Đã xóa file icon: ${fileName}`);
                }
            } catch (error) {
                console.error("Lỗi khi xóa file icon:", error);
            }
        }

        return deletedRecord;
    }
};

module.exports = ThuocTinhSanPhamService;