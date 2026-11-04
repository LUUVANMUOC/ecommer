const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

// ĐƯỜNG DẪN THƯ MỤC LƯU ẢNH THƯƠNG HIỆU
// Lưu ý: Bạn hãy kiểm tra lại tên thư mục (VD: 'thuonghieu' hoặc 'brands') 
// xem lúc cấu hình Multer ở Route đang lưu vào thư mục nào nhé.
const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/thuonghieu');

const ThuongHieuModel = {
    // Lấy tất cả
    getAll: async () => {
        const query = 'SELECT * FROM thuonghieu ORDER BY th_ma ASC';
        const result = await db.query(query);
        return result.rows;
    },

    // Lấy 1 theo mã
    getById: async (id) => {
        const query = 'SELECT * FROM thuonghieu WHERE th_ma = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    // Lấy mã lớn nhất để sinh mã tự động
    getLatestMa: async () => {
        const query = `
            SELECT th_ma FROM thuonghieu
            WHERE th_ma ~ '^TH[0-9]+$'  -- Chỉ tìm các mã chuẩn như TH01, TH02...
            ORDER BY CAST(SUBSTRING(th_ma FROM 3) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await db.query(query);
        return result.rows[0] ? result.rows[0].th_ma : null;
    },

    // Thêm mới
    create: async (data) => {
        const query = `
            INSERT INTO thuonghieu (th_ma, th_ten, th_mota, th_hinhanh) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const values = [data.th_ma, data.th_ten, data.th_mota, data.th_hinhanh];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    // Cập nhật
    update: async (id, data) => {
        try {
            // 1. Lấy thông tin cũ để kiểm tra ảnh
            const oldRecord = await ThuongHieuModel.getById(id);
            
            // Nếu Frontend không gửi ảnh mới, giữ nguyên ảnh cũ
            const finalImage = data.th_hinhanh || (oldRecord ? oldRecord.th_hinhanh : null);

            // 2. Cập nhật vào Database
            const query = `
                UPDATE thuonghieu 
                SET th_ten = $1, th_mota = $2, th_hinhanh = $3 
                WHERE th_ma = $4 
                RETURNING *
            `;
            const values = [data.th_ten, data.th_mota, finalImage, id];
            const result = await db.query(query, values);

            // 3. Xóa file ảnh cũ trong ổ cứng nếu có ảnh mới thay thế
            if (oldRecord && oldRecord.th_hinhanh && finalImage && oldRecord.th_hinhanh !== finalImage) {
                const oldFileName = path.basename(oldRecord.th_hinhanh);
                const oldFilePath = path.join(UPLOAD_DIR, oldFileName);

                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`[UPDATE] Đã xóa ảnh cũ: ${oldFileName}`);
                }
            }

            return result.rows[0];
        } catch (error) {
            console.error("Lỗi khi cập nhật thương hiệu:", error);
            throw error;
        }
    },

    // Xóa
    delete: async (id) => {
        try {
            // 1. Lấy thông tin cũ để biết đường dẫn ảnh
            const oldRecord = await ThuongHieuModel.getById(id);

            // 2. Xóa bản ghi trong Database
            const query = 'DELETE FROM thuonghieu WHERE th_ma = $1 RETURNING *';
            const result = await db.query(query, [id]);

            // 3. Xóa file ảnh vật lý khỏi ổ cứng
            if (oldRecord && oldRecord.th_hinhanh) {
                const fileName = path.basename(oldRecord.th_hinhanh);
                const filePath = path.join(UPLOAD_DIR, fileName);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[DELETE] Đã xóa file ảnh: ${fileName}`);
                }
            }

            return result.rows[0];
        } catch (error) {
            console.error("Lỗi khi xóa thương hiệu:", error);
            throw error;
        }
    }
};

module.exports = ThuongHieuModel;