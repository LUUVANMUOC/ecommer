const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const CONFIG = {
    GH_MA: 'GH01',
    UPLOAD_DIR: path.join(__dirname, '../../public/uploads/products')
};

const CATEGORY_NAMES = ['iPhone', 'iPad', 'Mac', 'Apple Watch', 'AirPods', 'Phụ kiện'];

(async () => {
    try {
        console.log(`== BẮT ĐẦU DỌN DẸP DỮ LIỆU CỦA GIAN HÀNG ${CONFIG.GH_MA} ==`);
        
        const dmRes = await pool.query(
            `SELECT dmsp_ma FROM danhmucsanpham WHERE gh_ma = $1 AND dmsp_ten = ANY($2)`, 
            [CONFIG.GH_MA, CATEGORY_NAMES]
        );
        const dmspMas = dmRes.rows.map(r => r.dmsp_ma);
        
        if (dmspMas.length === 0) {
            console.log('Không tìm thấy danh mục nào cần xóa.');
            return;
        }

        const spRes = await pool.query(
            `SELECT sp_ma FROM sanpham WHERE gh_ma = $1 AND dmsp_ma = ANY($2)`,
            [CONFIG.GH_MA, dmspMas]
        );
        const spMas = spRes.rows.map(r => r.sp_ma);
        let ctspMas = [];
        let fileLinks = [];

        if (spMas.length > 0) {
            const ctRes = await pool.query(
                `SELECT ctsp_ma FROM chitietsanpham WHERE sp_ma = ANY($1)`,
                [spMas]
            );
            ctspMas = ctRes.rows.map(r => r.ctsp_ma);

            if (ctspMas.length > 0) {
                const imgRes = await pool.query(
                    `SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ANY($1)`,
                    [ctspMas]
                );
                fileLinks = imgRes.rows.map(r => r.hasp_link);
            }
        }

        console.log(`Tìm thấy:`);
        console.log(` - ${dmspMas.length} danh mục`);
        console.log(` - ${spMas.length} sản phẩm`);
        console.log(` - ${ctspMas.length} chi tiết sản phẩm`);
        console.log(` - ${fileLinks.length} ảnh trong DB`);

        // Bỏ qua ràng buộc khóa ngoại để xóa sạch sẽ (yêu cầu quyền superuser)
        await pool.query('SET session_replication_role = replica;');
        
        try {
            if (ctspMas.length > 0) {
                // Xóa tất cả bảng phụ liên quan
                await pool.query('DELETE FROM hinhanhsanpham WHERE ctsp_ma = ANY($1)', [ctspMas]);
                await pool.query('DELETE FROM giabangoc WHERE ctsp_ma = ANY($1)', [ctspMas]);
                await pool.query('DELETE FROM giatrithuoctinh WHERE ctsp_ma = ANY($1)', [ctspMas]);
                await pool.query('DELETE FROM chitiettrangthaisanpham WHERE ctsp_ma = ANY($1)', [ctspMas]);
                // Xóa bảng chính
                await pool.query('DELETE FROM chitietsanpham WHERE ctsp_ma = ANY($1)', [ctspMas]);
                console.log(`  => Đã xóa dữ liệu chi tiết sản phẩm.`);
            }
            
            if (spMas.length > 0) {
                await pool.query('DELETE FROM sanpham WHERE sp_ma = ANY($1)', [spMas]);
                console.log(`  => Đã xóa dữ liệu sản phẩm.`);
            }
            
            if (dmspMas.length > 0) {
                await pool.query('DELETE FROM danhmucsanpham WHERE dmsp_ma = ANY($1)', [dmspMas]);
                console.log(`  => Đã xóa dữ liệu danh mục.`);
            }
        } finally {
            // Bật lại kiểm tra khóa ngoại
            await pool.query('SET session_replication_role = DEFAULT;');
        }

        // Xóa file ảnh vật lý trên ổ cứng
        let countFile = 0;
        for (const link of fileLinks) {
            try {
                const fileName = path.basename(link);
                const filePath = path.join(CONFIG.UPLOAD_DIR, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    countFile++;
                }
            } catch (err) {}
        }
        console.log(`  => Đã xóa ${countFile} file ảnh vật lý khỏi ổ cứng.`);

        console.log(`\n== HOÀN TẤT DỌN DẸP ==`);

    } catch (error) {
        console.error('Lỗi:', error);
    } finally {
        await pool.end();
    }
})();