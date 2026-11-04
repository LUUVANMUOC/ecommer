// backend/src/models/dvvc/dvvcModel.js
const db = require('../../config/db');

const DVVCModel = {
    // 1. Tìm ĐVVC bằng Email
    findByEmail: async (email) => {
        // Đã sửa tên bảng thành donvivanchuyen
        const query = 'SELECT * FROM donvivanchuyen WHERE dvvc_email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    },

    // 2. Lấy mã ĐVVC lớn nhất hiện tại
    getLatestMa: async () => {
        const query = `
            SELECT dvvc_ma FROM donvivanchuyen 
            WHERE dvvc_ma ~ '^DVVC[0-9]+$'
            ORDER BY CAST(SUBSTRING(dvvc_ma FROM 5) AS INTEGER) DESC 
            LIMIT 1
        `;
        const result = await db.query(query);
        return result.rows[0] ? result.rows[0].dvvc_ma : null;
    },

    // 3. Tạo ĐVVC mới
    createDVVC: async (data) => {
        const query = `
            INSERT INTO donvivanchuyen 
            (dvvc_ma, dvvc_ten, dvvc_hinhanh, dvvc_email, dvvc_hashpass, ct_ma, dvvc_mota) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING dvvc_ma, dvvc_ten, dvvc_email, dvvc_hinhanh, dvvc_mota
        `;
        const values = [
            data.dvvc_ma,
            data.dvvc_ten,
            data.dvvc_hinhanh,
            data.dvvc_email,
            data.dvvc_hashpass,
            data.ct_ma, // Sẽ truyền 'CT03' từ Service
            data.dvvc_mota
        ];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }
};

module.exports = DVVCModel;