const ThuongHieuModel = require('../../models/san/thuongHieuModel');
const fs = require('fs'); 
const path = require('path'); 

const ThuongHieuService = {
    getAll: async () => {
        return await ThuongHieuModel.getAll();
    },

    getById: async (id) => {
        const item = await ThuongHieuModel.getById(id);
        if (!item) throw new Error('Không tìm thấy thương hiệu này!');
        return item;
    },

    create: async (data) => {
        let newMa = 'TH01'; 
        const latestMa = await ThuongHieuModel.getLatestMa();
        
        if (latestMa) {
            const currentNumber = parseInt(latestMa.substring(2), 10);
            const nextNumber = currentNumber + 1;
            newMa = 'TH' + nextNumber.toString().padStart(2, '0');
        }

        const newData = {
            th_ma: newMa,
            th_ten: data.th_ten,
            th_mota: data.th_mota || null,
            th_hinhanh: data.th_hinhanh || null
        };

        return await ThuongHieuModel.create(newData);
    },

    update: async (id, data) => {
        const existing = await ThuongHieuModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy thương hiệu để cập nhật!');
        
        // Xử lý xóa ảnh cũ nếu có ảnh mới
        if (data.th_hinhanh && existing.th_hinhanh && data.th_hinhanh !== existing.th_hinhanh) {
            try {
                const fileName = path.basename(existing.th_hinhanh);
                // Đường dẫn lùi 3 cấp để ra ngoài thư mục src, trỏ vào public/uploads/brands
                const filePath = path.join(__dirname, '../../../public/uploads/brands', fileName);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[UPDATE] Đã xóa icon cũ: ${fileName}`);
                }
            } catch (error) {
                console.error("Lỗi khi xóa icon cũ:", error);
            }
        }

        const updateData = {
            th_ten: data.th_ten,
            th_mota: data.th_mota || null,
            th_hinhanh: data.th_hinhanh || existing.th_hinhanh || null
        };

        return await ThuongHieuModel.update(id, updateData);
    },

    delete: async (id) => {
        const existing = await ThuongHieuModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy thương hiệu để xóa!');
        
        const deletedRecord = await ThuongHieuModel.delete(id);

        if (existing.th_hinhanh) {
            try {
                const fileName = path.basename(existing.th_hinhanh);
                // Lùi 3 cấp
                const filePath = path.join(__dirname, '../../../public/uploads/brands', fileName);
                
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

module.exports = ThuongHieuService;