const NganHangModel = require('../../models/san/nganHangModel');
const fs = require('fs'); 
const path = require('path'); 

const NganHangService = {
    getAll: async () => {
        return await NganHangModel.getAll();
    },

    getById: async (id) => {
        const item = await NganHangModel.getById(id);
        if (!item) throw new Error('Không tìm thấy ngân hàng này!');
        return item;
    },

    // Tự động sinh mã ngân hàng (VD: NHG01, NHG02...)
    create: async (data) => {
        const allItems = await NganHangModel.getAll();
        let newMa = 'NHG01'; 

        if (allItems.length > 0) {
            let maxNumber = 0;
            allItems.forEach(item => {
                // Postgres trả về chữ thường nên ưu tiên item.nhg_ma
                const idString = item.nhg_ma || item.NHG_Ma; 
                if (idString) {
                    const numberPart = parseInt(idString.replace(/\D/g, ''), 10);
                    if (!isNaN(numberPart) && numberPart > maxNumber) {
                        maxNumber = numberPart;
                    }
                }
            });
            const nextNumber = maxNumber + 1;
            newMa = `NHG${nextNumber.toString().padStart(2, '0')}`;
        }

        const newData = {
            NHG_Ma: newMa,
            NHG_Ten: data.NHG_Ten,
            NHG_Logo: data.NHG_Logo || null
        };

        return await NganHangModel.create(newData);
    },

    // Cập nhật & Xóa ảnh logo cũ nếu có ảnh mới
    update: async (id, data) => {
        const existing = await NganHangModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy ngân hàng để cập nhật!');
        
        // XỬ LÝ XÓA ẢNH CŨ
        // Nếu có logo mới VÀ logo cũ tồn tại VÀ 2 đường dẫn khác nhau
        if (data.NHG_Logo && existing.nhg_logo && data.NHG_Logo !== existing.nhg_logo) {
            try {
                const fileName = path.basename(existing.nhg_logo);
                
                // SỬA LỖI TẠI ĐÂY: Dùng ../../../ để thoát khỏi thư mục src
                const filePath = path.join(__dirname, '../../../public/uploads/logos', fileName);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[UPDATE] Đã xóa logo cũ: ${fileName}`);
                } else {
                    console.log(`[UPDATE] Không tìm thấy file để xóa: ${filePath}`);
                }
            } catch (error) {
                console.error("Lỗi khi xóa logo cũ:", error);
            }
        }

        const updateData = {
            NHG_Ten: data.NHG_Ten,
            // Nếu có ảnh mới thì lấy, không thì giữ nguyên ảnh cũ
            NHG_Logo: data.NHG_Logo || existing.nhg_logo || null
        };

        return await NganHangModel.update(id, updateData);
    },

    // Xóa bản ghi & Xóa file logo vật lý
    delete: async (id) => {
        const existing = await NganHangModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy ngân hàng để xóa!');
        
        // 1. Xóa trong Database trước
        const deletedRecord = await NganHangModel.delete(id);

        // 2. Xóa file logo trên ổ cứng (nếu có)
        if (existing.nhg_logo) {
            try {
                const fileName = path.basename(existing.nhg_logo);
                
                // SỬA LỖI TẠI ĐÂY: Dùng ../../../ 
                const filePath = path.join(__dirname, '../../../public/uploads/logos', fileName);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[DELETE] Đã xóa file logo: ${fileName}`);
                } else {
                    console.log(`[DELETE] File không tồn tại trên ổ cứng: ${fileName}`);
                }
            } catch (error) {
                console.error("Lỗi khi xóa file logo:", error);
            }
        }

        return deletedRecord;
    }
};

module.exports = NganHangService;