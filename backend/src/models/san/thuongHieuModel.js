const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/thuonghieu');

const ThuongHieuModel = {
    // Lấy tất cả
    getAll: async () => {
        const query = 'SELECT * FROM thuonghieu ORDER BY th_ma ASC';
        const result = await db.query(query);
        return result.rows;
    },

    // 🟢 THÊM HÀM NÀY: Lấy thương hiệu theo Shop
    getByShop: async (gh_ma) => {
        const query = `
            SELECT DISTINCT th.th_ma, th.th_ten, th.th_hinhanh
            FROM thuonghieu th
            JOIN sanpham sp ON th.th_ma = sp.th_ma
            WHERE sp.gh_ma = $1
            ORDER BY th.th_ten ASC
        `;
        const result = await db.query(query, [gh_ma]);
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
            WHERE th_ma ~ '^TH[0-9]+$'
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
            const oldRecord = await ThuongHieuModel.getById(id);
            const finalImage = data.th_hinhanh || (oldRecord ? oldRecord.th_hinhanh : null);

            const query = `
                UPDATE thuonghieu 
                SET th_ten = $1, th_mota = $2, th_hinhanh = $3 
                WHERE th_ma = $4 
                RETURNING *
            `;
            const values = [data.th_ten, data.th_mota, finalImage, id];
            const result = await db.query(query, values);

            if (oldRecord && oldRecord.th_hinhanh && finalImage && oldRecord.th_hinhanh !== finalImage) {
                const oldFileName = path.basename(oldRecord.th_hinhanh);
                const oldFilePath = path.join(UPLOAD_DIR, oldFileName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
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
            const oldRecord = await ThuongHieuModel.getById(id);
            const query = 'DELETE FROM thuonghieu WHERE th_ma = $1 RETURNING *';
            const result = await db.query(query, [id]);

            if (oldRecord && oldRecord.th_hinhanh) {
                const fileName = path.basename(oldRecord.th_hinhanh);
                const filePath = path.join(UPLOAD_DIR, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
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