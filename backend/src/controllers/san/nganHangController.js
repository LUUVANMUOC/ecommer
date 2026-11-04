const NganHangService = require('../../services/san/nganHangService');

const NganHangController = {
    getAll: async (req, res) => {
        try {
            const data = await NganHangService.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const data = { ...req.body };

            // BẮT BUỘC PHẢI CÓ ĐOẠN NÀY ĐỂ LƯU ĐƯỜNG DẪN ẢNH
            if (req.file) {
                data.NHG_Logo = `/uploads/logos/${req.file.filename}`;
            }

            const result = await NganHangService.create(data);
            res.status(201).json({ message: 'Thêm thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const data = { ...req.body };
            
            // Tương tự khi cập nhật
            if (req.file) {
                data.NHG_Logo = `/uploads/logos/${req.file.filename}`;
            }

            const result = await NganHangService.update(req.params.id, data);
            res.status(200).json({ message: 'Cập nhật thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await NganHangService.delete(req.params.id);
            res.status(200).json({ message: 'Xóa thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = NganHangController;