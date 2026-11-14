const SanPhamService = require('../../services/gianhang/sanPhamService');

const DS_TRANG_THAI = ['active', 'pending', 'suspended', 'draft'];

const SanPhamController = {
    getByGianHang: async (req, res) => {
        try {
            const data = await SanPhamService.getByGianHang(req.params.gh_ma);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // GET /api/nguoi-ban/san-pham/phan-trang/:gh_ma?q=&th_ma=&dmsp_ma=&status=&page=&limit=
    getPhanTrang: async (req, res) => {
        try {
            const { gh_ma } = req.params;
            const { q, th_ma, dmsp_ma, status, page, limit } = req.query;

            const data = await SanPhamService.getPhanTrang({
                gh_ma,
                q: q || null,
                th_ma: th_ma || null,
                dmsp_ma: dmsp_ma || null,
                status: DS_TRANG_THAI.includes(status) ? status : null,
                page: Number(page) || 1,
                limit: Number(limit) || 12,
            });

            res.status(200).json(data);
        } catch (error) {
            console.error('Lỗi phân trang sản phẩm:', error);
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