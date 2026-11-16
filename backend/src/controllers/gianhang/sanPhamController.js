const SanPhamService = require('../../services/gianhang/sanPhamService');

const DS_TRANG_THAI = ['active', 'pending', 'suspended', 'draft'];

// Whitelist cho bộ lọc nâng cao + sắp xếp
const DS_SAO = ['0', '1', '2', '3', '4', '5'];
const DS_LUOT_MUA = ['0', '1-10', '11-50', '51-200', '200+'];
const DS_LUOT_XEM = ['0', '1-100', '101-1000', '1001-10000', '10000+'];
const DS_GIA = ['duoi-100k', '100k-500k', '500k-1tr', '1tr-5tr', 'tren-5tr'];
const DS_NGAY_DUYET = ['homnay', '7n', '30n', '90n', 'chua'];
const DS_SAP_XEP = ['moi', 'mua', 'xem', 'sao', 'gia_tang', 'gia_giam', 'duyet'];

// Chỉ nhận giá trị nằm trong whitelist, còn lại trả null
const pick = (value, whitelist) =>
    whitelist.includes(value) ? value : null;

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
    //   &sao=0..5&mua=0|1-10|11-50|51-200|200+
    //   &xem=0|1-100|101-1000|1001-10000|10000+
    //   &gia=duoi-100k|100k-500k|500k-1tr|1tr-5tr|tren-5tr
    //   &duyet=homnay|7n|30n|90n|chua
    //   &sort=moi|mua|xem|sao|gia_tang|gia_giam|duyet
    getPhanTrang: async (req, res) => {
        try {
            const { gh_ma } = req.params;
            const {
                q, th_ma, dmsp_ma, status,
                sao, mua, xem, gia, duyet, sort,
                page, limit,
            } = req.query;

            const data = await SanPhamService.getPhanTrang({
                gh_ma,
                q: q || null,
                th_ma: th_ma || null,
                dmsp_ma: dmsp_ma || null,
                status: DS_TRANG_THAI.includes(status) ? status : null,
                sao: pick(sao, DS_SAO),
                mua: pick(mua, DS_LUOT_MUA),
                xem: pick(xem, DS_LUOT_XEM),
                gia: pick(gia, DS_GIA),
                duyet: pick(duyet, DS_NGAY_DUYET),
                sort: pick(sort, DS_SAP_XEP),
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