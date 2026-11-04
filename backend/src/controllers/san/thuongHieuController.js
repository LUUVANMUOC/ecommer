const ThuongHieuService = require('../../services/san/thuongHieuService');

const ThuongHieuController = {
    getAll: async (req, res) => {
        try {
            const data = await ThuongHieuService.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const data = { ...req.body };
            // File từ multer sẽ nằm ở req.file
            if (req.file) {
                data.th_hinhanh = `/uploads/brands/${req.file.filename}`;
            }

            const result = await ThuongHieuService.create(data);
            res.status(201).json({ message: 'Thêm thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const data = { ...req.body };
            if (req.file) {
                data.th_hinhanh = `/uploads/brands/${req.file.filename}`;
            }

            const result = await ThuongHieuService.update(req.params.id, data);
            res.status(200).json({ message: 'Cập nhật thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await ThuongHieuService.delete(req.params.id);
            res.status(200).json({ message: 'Xóa thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = ThuongHieuController;