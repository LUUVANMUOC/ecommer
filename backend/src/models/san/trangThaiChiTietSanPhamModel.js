const pool = require('../../config/db');

const TrangThaiChiTietSanPhamModel = {
    // ==========================================================
    // A. REFERENCE DATA
    // ==========================================================
    getAll: async () => {
        const query = 'SELECT * FROM trangthaichitietsanpham ORDER BY ttctsp_ma ASC';
        const result = await pool.query(query);
        return result.rows;
    },

    getById: async (id) => {
        const query = 'SELECT * FROM trangthaichitietsanpham WHERE ttctsp_ma = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // ==========================================================
    // B. BUSINESS DATA
    // ==========================================================
    getDefaultStmdt: async () => {
        const result = await pool.query(
            'SELECT stmdt_ma FROM san_thuong_mai_dien_tu ORDER BY stmdt_ma ASC LIMIT 1'
        );
        return result.rows[0]?.stmdt_ma ?? null;
    },

    create: async (data) => {
        const query = `
            INSERT INTO chitiettrangthaisanpham 
                (stmdt_ma, ttctsp_ma, ctsp_ma, ctttsp_thoidiem, ctttsp_phanhoi, ctttsp_yeucau)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [
            data.stmdt_ma,
            data.ttctsp_ma,
            data.ctsp_ma,
            data.ctttsp_phanhoi || null,
            data.ctttsp_yeucau || null
        ]);
        return result.rows[0];
    },

    getByCtsp: async (ctsp_ma) => {
        const query = `
            SELECT 
                ct.stmdt_ma, ct.ttctsp_ma, ct.ctsp_ma, 
                ct.ctttsp_thoidiem, ct.ctttsp_phanhoi, ct.ctttsp_yeucau,
                tt.ttctsp_ten, tt.ttctsp_mota
            FROM chitiettrangthaisanpham ct
            LEFT JOIN trangthaichitietsanpham tt ON ct.ttctsp_ma = tt.ttctsp_ma
            WHERE ct.ctsp_ma = $1
            ORDER BY ct.ctttsp_thoidiem DESC
        `;
        const result = await pool.query(query, [ctsp_ma]);
        return result.rows;
    },

    getLatestByCtsp: async (ctsp_ma) => {
        const query = `
            SELECT 
                ct.stmdt_ma, ct.ttctsp_ma, ct.ctsp_ma, 
                ct.ctttsp_thoidiem, ct.ctttsp_phanhoi, ct.ctttsp_yeucau,
                tt.ttctsp_ten, tt.ttctsp_mota
            FROM chitiettrangthaisanpham ct
            LEFT JOIN trangthaichitietsanpham tt ON ct.ttctsp_ma = tt.ttctsp_ma
            WHERE ct.ctsp_ma = $1
            ORDER BY ct.ctttsp_thoidiem DESC
            LIMIT 1
        `;
        const result = await pool.query(query, [ctsp_ma]);
        return result.rows[0] || null;
    },

    // Lấy danh sách chờ duyệt cho Admin
    getChoDuyet: async () => {
        const query = `
            WITH latest AS (
                SELECT DISTINCT ON (ctsp_ma) 
                    ctsp_ma, ttctsp_ma, ctttsp_thoidiem, ctttsp_yeucau, ctttsp_phanhoi
                FROM chitiettrangthaisanpham
                ORDER BY ctsp_ma, ctttsp_thoidiem DESC
            )
            SELECT 
                l.ctsp_ma, l.ttctsp_ma, l.ctttsp_thoidiem, l.ctttsp_yeucau, l.ctttsp_phanhoi,
                ctsp.ctsp_ten, ctsp.ctsp_mota, ctsp.ctsp_soluongton,
                ctsp.ctsp_chieudai, ctsp.ctsp_chieurong, ctsp.ctsp_khoiluong,
                ctsp.sp_ma, ctsp.ctsp_gianban,
                sp.sp_ten, sp.gh_ma, sp.sp_mota AS sp_mota_chung,
                nh.nh_ten,
                gb.gb_gia,
                tt.ttctsp_ten,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'hasp_ma', ha.hasp_ma, 'hasp_link', ha.hasp_link, 
                        'hasp_mota', ha.hasp_mota, 'hasp_laanhchinh', ha.hasp_laanhchinh
                    ) ORDER BY ha.hasp_laanhchinh DESC, ha.hasp_thutu ASC)
                    FROM hinhanhsanpham ha WHERE ha.ctsp_ma = ctsp.ctsp_ma),
                    '[]'::json
                ) AS images,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'ttsp_ma', gt.ttsp_ma, 'ttsp_ten', ttsp.thsp_ten, 
                        'gttt_giatridinhtinh', gt.gttt_giatridinhtinh, 
                        'gttt_giatridinhluong', gt.gttt_giatridinhluong
                    ) ORDER BY ttsp.thsp_ten)
                    FROM giatrithuoctinh gt
                    LEFT JOIN thuoctinhsanpham ttsp ON gt.ttsp_ma = ttsp.thsp_ma
                    WHERE gt.ctsp_ma = ctsp.ctsp_ma),
                    '[]'::json
                ) AS thuoctinh
            FROM latest l
            JOIN chitietsanpham ctsp ON l.ctsp_ma = ctsp.ctsp_ma
            JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
            LEFT JOIN nganhhang nh ON ctsp.nh_ma = nh.nh_ma
            LEFT JOIN LATERAL (
                SELECT gb_gia FROM giabangoc WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY gb_thoidiem DESC LIMIT 1
            ) gb ON true
            LEFT JOIN trangthaichitietsanpham tt ON l.ttctsp_ma = tt.ttctsp_ma
            WHERE l.ttctsp_ma = 'TTCTSP0001'
            ORDER BY l.ctttsp_thoidiem ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    // Lấy TẤT CẢ sản phẩm của mọi gian hàng
    getAllSanPham: async () => {
        const query = `
            WITH latest_status AS (
                SELECT DISTINCT ON (ctsp_ma) 
                    ctsp_ma, ttctsp_ma, ctttsp_thoidiem
                FROM chitiettrangthaisanpham
                ORDER BY ctsp_ma, ctttsp_thoidiem DESC
            )
            SELECT 
                ctsp.ctsp_ma, ctsp.ctsp_ten, ctsp.ctsp_gianban, ctsp.ctsp_soluongton,
                sp.sp_ma, sp.sp_ten,
                gh.gh_ma, gh.gh_ten,
                ls.ttctsp_ma, tt.ttctsp_ten,
                (SELECT hasp_link FROM hinhanhsanpham 
                 WHERE ctsp_ma = ctsp.ctsp_ma 
                 ORDER BY hasp_laanhchinh DESC, hasp_thutu ASC LIMIT 1) AS main_image
            FROM chitietsanpham ctsp
            JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
            JOIN gianhang gh ON sp.gh_ma = gh.gh_ma
            LEFT JOIN latest_status ls ON ctsp.ctsp_ma = ls.ctsp_ma
            LEFT JOIN trangthaichitietsanpham tt ON ls.ttctsp_ma = tt.ttctsp_ma
            ORDER BY ctsp.ctsp_ma DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
};

module.exports = TrangThaiChiTietSanPhamModel;