const SanPhamService = require('../../services/gianhang/sanPhamService');

const DS_TRANG_THAI = ['active', 'pending', 'suspended', 'draft'];
const DS_SAP_XEP = ['moi', 'mua', 'xem', 'sao', 'gia_tang', 'gia_giam', 'duyet', 'duyet_cu'];

// Chuỗi rỗng / không phải số / số âm → null (bỏ lọc)
const num = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
};

// Đảm bảo Từ ≤ Đến (tự hoán đổi nếu client gửi ngược)
const range = (a, b) => {
    let tu = num(a);
    let den = num(b);
    if (tu !== null && den !== null && tu > den) [tu, den] = [den, tu];
    return [tu, den];
};

const SanPhamController = {
    getByGianHang: async (req, res) => {
        try {
            const data = await SanPhamService.getByGianHang(req.params.gh_ma);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // GET /api/nguoi-ban/san-pham/phan-trang/:gh_ma
    //   ?q=&th_ma=&dmsp_ma=&status=&page=&limit=
    //   &mua_tu=&mua_den=&xem_tu=&xem_den=&gia_tu=&gia_den=&sao_tu=&sao_den=
    //   &sort=moi|mua|xem|sao|gia_tang|gia_giam|duyet|duyet_cu
    getPhanTrang: async (req, res) => {
        try {
            const { gh_ma } = req.params;
            const {
                q, th_ma, dmsp_ma, status,
                mua_tu, mua_den, xem_tu, xem_den,
                gia_tu, gia_den, sao_tu, sao_den,
                sort, page, limit,
            } = req.query;

            const [muaTu, muaDen] = range(mua_tu, mua_den);
            const [xemTu, xemDen] = range(xem_tu, xem_den);
            const [giaTu, giaDen] = range(gia_tu, gia_den);
            const [saoTu, saoDen] = range(sao_tu, sao_den);

            const data = await SanPhamService.getPhanTrang({
                gh_ma,
                q: q || null,
                th_ma: th_ma || null,
                dmsp_ma: dmsp_ma || null,
                status: DS_TRANG_THAI.includes(status) ? status : null,
                mua_tu: muaTu,
                mua_den: muaDen,
                xem_tu: xemTu,
                xem_den: xemDen,
                gia_tu: giaTu,
                gia_den: giaDen,
                sao_tu: saoTu,
                sao_den: saoDen,
                sort: DS_SAP_XEP.includes(sort) ? sort : null,
                page: Number(page) || 1,
                limit: Number(limit) || 12,
            });

            res.status(200).json(data);
        } catch (error) {
            console.error('Lỗi phân trang sản phẩm:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // GET /api/nguoi-ban/san-pham/khoang-loc/:gh_ma
    getKhoangLoc: async (req, res) => {
        try {
            const data = await SanPhamService.getKhoangLoc(req.params.gh_ma);
            res.status(200).json(data);
        } catch (error) {
            console.error('Lỗi lấy khoảng lọc sản phẩm:', error);
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const result = await SanPhamService.create(req.body);
            res.status(201).json({ message: 'Tạo sản phẩm thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const result = await SanPhamService.update(req.params.id, req.body);
            res.status(200).json({ message: 'Cập nhật thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await SanPhamService.delete(req.params.id);
            res.status(200).json({ message: 'Xóa thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
};

module.exports = SanPhamController;