const NganhHangModel = require('../../models/san/nganhHangModel');

const NganhHangController = {
    getAll: async (req, res) => {
        try {
            const data = await NganhHangModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const data = { ...req.body };
            if (req.file) {
                data.nh_hinhanh = `/uploads/categories/${req.file.filename}`;
            }
            const result = await NganhHangModel.create(data);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const data = { ...req.body };
            if (req.file) {
                data.nh_hinhanh = `/uploads/categories/${req.file.filename}`;
            }
            const result = await NganhHangModel.update(req.params.id, data);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const result = await NganhHangModel.delete(req.params.id);
            if (!result) {
                return res.status(404).json({ message: 'Không tìm thấy ngành hàng để xóa.' });
            }
            res.status(200).json({
                message: `Đã xóa thành công ${result.deleted_count} ngành hàng (bao gồm ngành con).`,
                data: result
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = NganhHangController;