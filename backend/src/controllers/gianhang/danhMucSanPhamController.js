const DanhMucSanPhamService = require('../../services/gianhang/danhMucSanPhamService');

const DanhMucSanPhamController = {
    getByGianHang: async (req, res) => {
        try {
            const data = await DanhMucSanPhamService.getByGianHang(req.params.gh_ma);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const data = { ...req.body };
            if (req.file) {
                data.dmsp_hinhanh = `/uploads/categories/${req.file.filename}`;
            }
            const result = await DanhMucSanPhamService.create(data);
            res.status(201).json({ message: 'Thêm thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const data = { ...req.body };
            if (req.file) {
                data.dmsp_hinhanh = `/uploads/categories/${req.file.filename}`;
            }
            const result = await DanhMucSanPhamService.update(req.params.id, data);
            res.status(200).json({ message: 'Cập nhật thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await DanhMucSanPhamService.delete(req.params.id);
            res.status(200).json({ message: 'Xóa thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = DanhMucSanPhamController;