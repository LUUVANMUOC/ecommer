const SanPhamService = require('../../services/gianhang/sanPhamService');

const SanPhamController = {
    getByGianHang: async (req, res) => {
        try {
            const data = await SanPhamService.getByGianHang(req.params.gh_ma);
            res.status(200).json(data);
        } catch (error) {
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
    }
};

module.exports = SanPhamController;