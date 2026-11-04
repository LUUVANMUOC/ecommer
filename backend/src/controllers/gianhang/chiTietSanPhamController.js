const ChiTietSanPhamService = require('../../services/gianhang/chiTietSanPhamService');

const ChiTietSanPhamController = {
    getBySanPham: async (req, res) => {
        try {
            const data = await ChiTietSanPhamService.getBySanPham(req.params.sp_ma);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const data = { ...req.body };

            // Xử lý an toàn cho cả 2 trường hợp: Mảng file (upload.array) hoặc 1 file (upload.single)
            let files = [];
            if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                files = req.files;
            } else if (req.file) {
                files = [req.file];
            }

            console.log(`[UPLOAD] Có ${files.length} ảnh được gửi lên cho CTSP.`);

            if (files.length > 0) {
                const imageMetas = JSON.parse(data.image_metas || "[]");

                data.images = files.map((file, index) => {
                    const meta = imageMetas[index] || {};
                    return {
                        hasp_link: `/uploads/products/${file.filename}`,
                        hasp_mota: meta.mota || null,
                        hasp_laanhchinh: meta.laanhchinh === true,
                        hasp_thutu: meta.thutu || (index + 1)
                    };
                });
            } else {
                data.images = [];
            }

            // Parse thuộc tính (JSON string từ FormData)
            try {
                data.thuoctinh = JSON.parse(data.thuoctinh || "[]");
            } catch {
                data.thuoctinh = [];
            }

            const result = await ChiTietSanPhamService.create(data);
            res.status(201).json({ message: 'Thêm chi tiết thành công!', data: result });
        } catch (error) {
            console.error("❌ Lỗi thêm chi tiết:", error);
            res.status(400).json({ message: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const data = { ...req.body };

            let files = [];
            if (req.files && Array.isArray(req.files) && req.files.length > 0) files = req.files;
            else if (req.file) files = [req.file];

            // Lấy meta của ảnh (bao gồm cả ảnh cũ và ảnh mới)
            const imageMetas = JSON.parse(data.image_metas || "[]");

            // Map file mới vào đúng vị trí của nó trong mảng imageMetas
            let fileIndex = 0;
            data.images = imageMetas.map((meta, index) => {
                if (meta.hasp_ma) {
                    return {
                        hasp_ma: meta.hasp_ma,
                        hasp_link: meta.hasp_link,
                        hasp_mota: meta.mota || null,
                        hasp_laanhchinh: meta.laanhchinh === true,
                        hasp_thutu: meta.thutu || (index + 1)
                    };
                } else {
                    const file = files[fileIndex];
                    fileIndex++;
                    return {
                        hasp_ma: null,
                        hasp_link: file ? `/uploads/products/${file.filename}` : null,
                        hasp_mota: meta.mota || null,
                        hasp_laanhchinh: meta.laanhchinh === true,
                        hasp_thutu: meta.thutu || (index + 1)
                    };
                }
            }).filter(img => img.hasp_link);

            // Parse thuộc tính (JSON string từ FormData)
            try {
                data.thuoctinh = JSON.parse(data.thuoctinh || "[]");
            } catch {
                data.thuoctinh = [];
            }

            const result = await ChiTietSanPhamService.update(req.params.id, data);
            res.status(200).json({ message: 'Cập nhật chi tiết thành công!', data: result });
        } catch (error) {
            console.error("❌ Lỗi cập nhật chi tiết:", error);
            res.status(400).json({ message: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await ChiTietSanPhamService.delete(req.params.id);
            res.status(200).json({ message: 'Xóa chi tiết thành công!' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
     increaseView: async (req, res) => {
        try {
            const result = await ChiTietSanPhamService.increaseView(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // ✅ API Thích / Hủy thích
    toggleLike: async (req, res) => {
        try {
            const { isLiked } = req.body; // Nhận trạng thái từ Frontend gửi lên
            const result = await ChiTietSanPhamService.toggleLike(req.params.id, isLiked);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
};

module.exports = ChiTietSanPhamController;