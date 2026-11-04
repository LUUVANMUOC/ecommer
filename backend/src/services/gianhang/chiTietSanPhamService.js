// backend/src/services/gianhang/chiTietSanPhamService.js
const ChiTietSanPhamModel = require('../../models/gianhang/chiTietSanPhamModel');
const NganhHangModel = require('../../models/san/nganhHangModel');
const pool = require('../../config/db');

/**
 * Validate: ngành hàng phải là ngành lá (con cuối cùng)
 * vì chỉ ngành lá mới có phí chiết khấu.
 */
const validateNganhHangLeaf = async (nh_ma) => {
    if (!nh_ma) {
        throw new Error('Vui lòng chọn ngành hàng cho phân loại sản phẩm.');
    }
    const isLeaf = await NganhHangModel.isLeaf(nh_ma);
    if (!isLeaf) {
        throw new Error(
            'Chỉ được chọn ngành hàng con cuối cùng (ngành hàng không có ngành con) vì chỉ ngành lá mới có phí chiết khấu. Vui lòng chọn lại.'
        );
    }
};

/**
 * Lấy phí chiết khấu mới nhất của ngành hàng từ bảng phisanchieckhau.
 * Trả về 0 nếu chưa có.
 */
const getPsckPhantramMoiNhat = async (nh_ma) => {
    try {
        const result = await pool.query(
            `SELECT psck_phantram 
             FROM phisanchieckhau 
             WHERE nh_ma = $1 
             ORDER BY psck_thoidiem DESC 
             LIMIT 1`,
            [nh_ma]
        );
        return result.rows[0]?.psck_phantram ?? 0;
    } catch (err) {
        console.error('Lỗi lấy phí chiết khấu:', err.message);
        return 0;
    }
};

const ChiTietSanPhamService = {
    getBySanPham: async (sp_ma) => {
        return await ChiTietSanPhamModel.getBySanPham(sp_ma);
    },

    create: async (data) => {
        await validateNganhHangLeaf(data.nh_ma);

        let newMa = 'CTSP01';
        const latestMa = await ChiTietSanPhamModel.getLatestMa();
        if (latestMa) {
            const currentNumber = parseInt(latestMa.replace('CTSP', ''), 10);
            newMa = 'CTSP' + (currentNumber + 1).toString().padStart(2, '0');
        }

        // Lấy phí sàn mới nhất để Model tính ctsp_gianban
        const psck_phantram = await getPsckPhantramMoiNhat(data.nh_ma);

        const newData = {
            ctsp_ma: newMa,
            sp_ma: data.sp_ma,
            ctsp_ten: data.ctsp_ten,
            ctsp_mota: data.ctsp_mota || null,
            ctsp_soluongton: Number(data.ctsp_soluongton) || 0,
            ctsp_chieudai: Number(data.ctsp_chieudai) || 1,
            ctsp_chieurong: Number(data.ctsp_chieurong) || 1,
            ctsp_khoiluong: Number(data.ctsp_khoiluong) || 1,
            nh_ma: data.nh_ma,
            gb_gia: Number(data.gb_gia) || 0,
            psck_phantram,
            images: data.images || [],
            thuoctinh: Array.isArray(data.thuoctinh) ? data.thuoctinh : []
        };

        return await ChiTietSanPhamModel.createFullDetail(newData);
    },

    update: async (id, data) => {
        const existing = await ChiTietSanPhamModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy chi tiết sản phẩm!');

        await validateNganhHangLeaf(data.nh_ma);

        // Lấy lại phí sàn (có thể đã đổi từ lần tạo trước)
        const psck_phantram = await getPsckPhantramMoiNhat(data.nh_ma);

        const updateData = {
            ctsp_ten: data.ctsp_ten,
            ctsp_mota: data.ctsp_mota || null,
            ctsp_soluongton: Number(data.ctsp_soluongton) || 0,
            ctsp_chieudai: Number(data.ctsp_chieudai) || 1,
            ctsp_chieurong: Number(data.ctsp_chieurong) || 1,
            ctsp_khoiluong: Number(data.ctsp_khoiluong) || 1,
            nh_ma: data.nh_ma,
            gb_gia: Number(data.gb_gia) || 0,
            psck_phantram,
            images: data.images || [],
            thuoctinh: Array.isArray(data.thuoctinh) ? data.thuoctinh : []
        };

        return await ChiTietSanPhamModel.updateFullDetail(id, updateData);
    },

    delete: async (id) => {
        const existing = await ChiTietSanPhamModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy chi tiết sản phẩm!');
        return await ChiTietSanPhamModel.delete(id);
    },
        increaseView: async (ctsp_ma) => {
        return await ChiTietSanPhamModel.increaseView(ctsp_ma);
    },

    toggleLike: async (ctsp_ma, isLiked) => {
        return await ChiTietSanPhamModel.toggleLike(ctsp_ma, isLiked);
    },
};

module.exports = ChiTietSanPhamService;