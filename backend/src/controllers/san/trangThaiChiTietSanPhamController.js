const TrangThaiChiTietSanPhamModel = require('../../models/san/trangThaiChiTietSanPhamModel');
const ChiTietSanPhamModel = require('../../models/gianhang/chiTietSanPhamModel');

const TrangThaiChiTietSanPhamController = {
    // ==========================================================
    // A. REFERENCE DATA
    // ==========================================================
    getAll: async (req, res) => {
        try {
            const data = await TrangThaiChiTietSanPhamModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            console.error("Lỗi lấy danh sách trạng thái chi tiết:", error);
            res.status(500).json({ message: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const data = await TrangThaiChiTietSanPhamModel.getById(req.params.id);
            if (!data) return res.status(404).json({ message: 'Không tìm thấy trạng thái' });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // ==========================================================
    // B. SELLER — gửi duyệt
    //    POST /api/trang-thai-chi-tiet/gui-duyet  { ctsp_ma, yeucau }
    // ==========================================================
    submitForApproval: async (req, res) => {
        try {
            const { ctsp_ma, yeucau } = req.body;
            if (!ctsp_ma) {
                return res.status(400).json({ message: 'Thiếu mã chi tiết sản phẩm.' });
            }

            const ctsp = await ChiTietSanPhamModel.getById(ctsp_ma);
            if (!ctsp) {
                return res.status(404).json({ message: 'Không tìm thấy chi tiết sản phẩm.' });
            }

            const latest = await TrangThaiChiTietSanPhamModel.getLatestByCtsp(ctsp_ma);
            if (latest?.ttctsp_ma === 'TTCTSP0001') {
                return res.status(400).json({
                    message: 'Phân loại này đang chờ duyệt, không thể gửi lại.'
                });
            }
            if (latest?.ttctsp_ma === 'TTCTSP0002') {
                return res.status(400).json({
                    message: 'Phân loại này đã được duyệt, không cần gửi lại.'
                });
            }

            const stmdt_ma = await TrangThaiChiTietSanPhamModel.getDefaultStmdt();
            if (!stmdt_ma) {
                return res.status(400).json({
                    message: 'Chưa có sàn thương mại điện tử nào trong hệ thống.'
                });
            }

            const result = await TrangThaiChiTietSanPhamModel.create({
                stmdt_ma,
                ttctsp_ma: 'TTCTSP0001',
                ctsp_ma,
                ctttsp_yeucau: (yeucau || '').trim() || 'Yêu cầu duyệt sản phẩm'
            });

            res.status(201).json({
                message: 'Đã gửi duyệt thành công! Vui lòng chờ sàn phê duyệt.',
                data: result
            });
        } catch (error) {
            console.error('Lỗi gửi duyệt:', error);
            res.status(400).json({ message: error.message });
        }
    },

    // ==========================================================
    // C. ADMIN — duyệt
    //    POST /api/trang-thai-chi-tiet/admin/:ctsp_ma/duyet  { phanhoi }
    // ==========================================================
    approve: async (req, res) => {
        try {
            const { ctsp_ma } = req.params;
            const { phanhoi } = req.body || {};

            if (!ctsp_ma) {
                return res.status(400).json({ message: 'Thiếu mã chi tiết sản phẩm.' });
            }

            const ctsp = await ChiTietSanPhamModel.getById(ctsp_ma);
            if (!ctsp) {
                return res.status(404).json({ message: 'Không tìm thấy chi tiết sản phẩm.' });
            }

            const stmdt_ma = await TrangThaiChiTietSanPhamModel.getDefaultStmdt();
            if (!stmdt_ma) {
                return res.status(400).json({ message: 'Chưa có sàn trong hệ thống.' });
            }

            const result = await TrangThaiChiTietSanPhamModel.create({
                stmdt_ma,
                ttctsp_ma: 'TTCTSP0002',
                ctsp_ma,
                ctttsp_phanhoi: (phanhoi || '').trim() || 'Đã duyệt'
            });

            res.status(201).json({
                message: 'Đã duyệt phân loại! Sản phẩm có thể được bán.',
                data: result
            });
        } catch (error) {
            console.error('Lỗi duyệt:', error);
            res.status(400).json({ message: error.message });
        }
    },

    // ==========================================================
    // D. ADMIN — đình chỉ
    //    POST /api/trang-thai-chi-tiet/admin/:ctsp_ma/dinh-chi  { phanhoi }
    // ==========================================================
    suspend: async (req, res) => {
        try {
            const { ctsp_ma } = req.params;
            const { phanhoi } = req.body || {};

            if (!ctsp_ma) {
                return res.status(400).json({ message: 'Thiếu mã chi tiết sản phẩm.' });
            }

            const ctsp = await ChiTietSanPhamModel.getById(ctsp_ma);
            if (!ctsp) {
                return res.status(404).json({ message: 'Không tìm thấy chi tiết sản phẩm.' });
            }

            const stmdt_ma = await TrangThaiChiTietSanPhamModel.getDefaultStmdt();
            if (!stmdt_ma) {
                return res.status(400).json({ message: 'Chưa có sàn trong hệ thống.' });
            }

            const result = await TrangThaiChiTietSanPhamModel.create({
                stmdt_ma,
                ttctsp_ma: 'TTCTSP0003',
                ctsp_ma,
                ctttsp_phanhoi: (phanhoi || '').trim() || 'Bị đình chỉ'
            });

            res.status(201).json({
                message: 'Đã đình chỉ phân loại! Sản phẩm không thể bán.',
                data: result
            });
        } catch (error) {
            console.error('Lỗi đình chỉ:', error);
            res.status(400).json({ message: error.message });
        }
    },

    // ==========================================================
    // E. TRUY VẤN LỊCH SỬ
    // ==========================================================
    getByCtsp: async (req, res) => {
        try {
            const data = await TrangThaiChiTietSanPhamModel.getByCtsp(req.params.ctsp_ma);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getLatestByCtsp: async (req, res) => {
        try {
            const data = await TrangThaiChiTietSanPhamModel.getLatestByCtsp(req.params.ctsp_ma);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // ==========================================================
    // F. ADMIN — danh sách chờ duyệt
    // ==========================================================
    getChoDuyet: async (req, res) => {
        try {
            const data = await TrangThaiChiTietSanPhamModel.getChoDuyet();
            res.status(200).json(data);
        } catch (error) {
            console.error('Lỗi lấy danh sách chờ duyệt:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // ==========================================================
    // G. ADMIN — Lấy tất cả sản phẩm toàn sàn
    // ==========================================================
    getAllSanPham: async (req, res) => {
        try {
            const data = await TrangThaiChiTietSanPhamModel.getAllSanPham();
            res.status(200).json(data);
        } catch (error) {
            console.error('Lỗi lấy tất cả sản phẩm:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // 🟢 API Gửi duyệt hàng loạt
    submitAllForApproval: async (req, res) => {
        try {
            const { sp_ma } = req.body;
            if (!sp_ma) {
                return res.status(400).json({ message: 'Thiếu mã sản phẩm.' });
            }

            const result = await TrangThaiChiTietSanPhamModel.submitAllByProduct(sp_ma);

            if (result.count === 0) {
                return res.status(200).json({
                    message: 'Tất cả phân loại đã được gửi duyệt hoặc đang chờ duyệt. Không có phân loại nào cần gửi.',
                    count: 0
                });
            }

            res.status(200).json({
                message: `Đã gửi duyệt thành công ${result.count} phân loại!`,
                count: result.count
            });
        } catch (error) {
            console.error('Lỗi gửi duyệt hàng loạt:', error);
            res.status(400).json({ message: error.message });
        }
    },

    // ==========================================================
    // H. ADMIN — sản phẩm toàn sàn có phân trang + tìm kiếm + lọc
    //    GET /api/trang-thai-chi-tiet/admin/san-pham-phan-trang
    // ==========================================================
    getSanPhamPhanTrang: async (req, res) => {
        try {
            const { q, gh_ma, trang_thai, nh_ma, page, limit } = req.query;
            const TRANG_THAI_HOP_LE = [
                'TTCTSP0001',
                'TTCTSP0002',
                'TTCTSP0003',
                'DEFAULT',
            ];
            const nh_ma_hop_le = /^NH_[0-9]+$/.test(String(nh_ma || ''))
                ? String(nh_ma)
                : null;

            const data = await TrangThaiChiTietSanPhamModel.getSanPhamPhanTrang({
                q: String(q || '').trim() || null,
                gh_ma: gh_ma || null,
                trang_thai: TRANG_THAI_HOP_LE.includes(trang_thai) ? trang_thai : null,
                nh_ma: nh_ma_hop_le,
                page: Number(page) || 1,
                limit: Number(limit) || 24,
            });

            res.status(200).json(data);
        } catch (error) {
            console.error('Lỗi lấy sản phẩm phân trang:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // ==========================================================
    // I. ADMIN — chi tiết đầy đủ 1 sản phẩm (mọi phân loại)
    //    GET /api/trang-thai-chi-tiet/admin/san-pham/:sp_ma/chi-tiet
    // ==========================================================
    getChiTietSanPhamAdmin: async (req, res) => {
        try {
            const { sp_ma } = req.params;
            if (!sp_ma) {
                return res.status(400).json({ message: 'Thiếu mã sản phẩm.' });
            }

            const data = await TrangThaiChiTietSanPhamModel.getChiTietSanPhamAdmin(sp_ma);
            if (!data) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
            }

            res.status(200).json(data);
        } catch (error) {
            console.error('Lỗi lấy chi tiết sản phẩm (admin):', error);
            res.status(500).json({ message: error.message });
        }
    },
};

module.exports = TrangThaiChiTietSanPhamController;