const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Đường dẫn thư mục chứa ảnh thuộc tính (Lùi 3 cấp từ src/models/san)
const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/attributes');

const ThuocTinhSanPhamModel = {
    getAll: async () => {
        const query = 'SELECT * FROM thuoctinhsanpham ORDER BY thsp_ma ASC';
        const result = await db.query(query);
        return result.rows;
    },

    getById: async (id) => {
        const query = 'SELECT * FROM thuoctinhsanpham WHERE thsp_ma = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    getLatestMa: async () => {
        // Lấy mã lớn nhất có định dạng THSP + số (VD: THSP01)
        const query = `
            SELECT thsp_ma FROM thuoctinhsanpham 
            WHERE thsp_ma ~ '^THSP[0-9]+$'
            ORDER BY CAST(SUBSTRING(thsp_ma FROM 5) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await db.query(query);
        return result.rows[0] ? result.rows[0].thsp_ma : null;
    },

    create: async (data) => {
        const query = `
            INSERT INTO thuoctinhsanpham (thsp_ma, thsp_ten, thsp_mota, thsp_icon) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const values = [data.thsp_ma, data.thsp_ten, data.thsp_mota, data.thsp_icon];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    update: async (id, data) => {
        try {
            // 1. Lấy thông tin cũ để kiểm tra ảnh
            const oldRecord = await ThuocTinhSanPhamModel.getById(id);
            
            // Nếu Frontend không gửi ảnh mới (data.thsp_icon bị undefined), giữ nguyên ảnh cũ
            const finalImage = data.thsp_icon || (oldRecord ? oldRecord.thsp_icon : null);

            // 2. Cập nhật Database
            const query = `
                UPDATE thuoctinhsanpham 
                SET thsp_ten = $1, thsp_mota = $2, thsp_icon = $3 
                WHERE thsp_ma = $4 
                RETURNING *
            `;
            const values = [data.thsp_ten, data.thsp_mota, finalImage, id];
            const result = await db.query(query, values);

            // 3. Nếu có ảnh mới thay thế ảnh cũ -> Xóa file ảnh cũ trong ổ cứng
            if (oldRecord && oldRecord.thsp_icon && finalImage && oldRecord.thsp_icon !== finalImage) {
                const oldFileName = path.basename(oldRecord.thsp_icon);
                const oldFilePath = path.join(UPLOAD_DIR, oldFileName);

                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`[UPDATE] Đã xóa ảnh cũ: ${oldFileName}`);
                }
            }

            return result.rows[0];
        } catch (error) {
            console.error("Lỗi khi cập nhật thuộc tính:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            // 1. Lấy thông tin cũ để biết đường dẫn ảnh
            const oldRecord = await ThuocTinhSanPhamModel.getById(id);

            // 2. Xóa bản ghi trong Database
            const query = 'DELETE FROM thuoctinhsanpham WHERE thsp_ma = $1 RETURNING *';
            const result = await db.query(query, [id]);

            // 3. Xóa file ảnh vật lý khỏi ổ cứng
            if (oldRecord && oldRecord.thsp_icon) {
                const fileName = path.basename(oldRecord.thsp_icon);
                const filePath = path.join(UPLOAD_DIR, fileName);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[DELETE] Đã xóa file ảnh: ${fileName}`);
                }
            }

            return result.rows[0];
        } catch (error) {
            console.error("Lỗi khi xóa thuộc tính:", error);
            throw error;
        }
    }
};

module.exports = ThuocTinhSanPhamModel;