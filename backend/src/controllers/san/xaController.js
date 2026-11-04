const XaService = require('../../services/san/xaService');

const XaController = {
    getAll: async (req, res) => {
        try {
            const data = await XaService.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            // Bảng TrangThaiDon không có ảnh, nên chỉ cần lấy req.body
            const data = await XaService.create(req.body);
            res.status(201).json({ message: 'Thêm thành công!', data });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const data = await XaService.update(req.params.id, req.body);
            res.status(200).json({ message: 'Cập nhật thành công!', data });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await XaService.delete(req.params.id);
            res.status(200).json({ message: 'Xóa thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = XaController;