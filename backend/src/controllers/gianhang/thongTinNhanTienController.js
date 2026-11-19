const ThongTinNhanTienModel = require('../../models/gianhang/thongTinNhanTienModel');
const { encrypt, decrypt } = require('../../config/secretCrypto');

const ThongTinNhanTienController = {
    // 1. Lấy thông tin (KHÔNG trả secret nguyên văn)
    getByGianHang: async (req, res) => {
        try {
            const data = await ThongTinNhanTienModel.getByGianHang(req.params.gh_ma);
            if (!data) return res.status(200).json(null);

            const secret = decrypt(data.sepay_webhook_secret);
            const ketQua = { ...data };
            delete ketQua.sepay_webhook_secret;

            ketQua.sepay_webhook_secret_set = !!secret;
            // Thời điểm lưu secret (null nếu secret có từ trước khi thêm cột này)
            ketQua.sepay_webhook_secret_saved_at =
                data.sepay_webhook_secret_saved_at || null;

            res.status(200).json(ketQua);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 2. Lưu thông tin (Thêm mới/Cập nhật)
    save: async (req, res) => {
        try {
            const { gh_ma, nh_ma, ttnt_gianhang_tentaikhoan, ttnt_gianhang_sotaikhoan, sepay_webhook_secret } = req.body;

            if (!gh_ma || !nh_ma || !ttnt_gianhang_tentaikhoan || !ttnt_gianhang_sotaikhoan) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin tài khoản.' });
            }

            // Để trống = giữ nguyên secret cũ (đã xử lý trong model)
            const secretMoi =
                sepay_webhook_secret !== null &&
                sepay_webhook_secret !== undefined &&
                String(sepay_webhook_secret).trim() !== ''
                    ? encrypt(String(sepay_webhook_secret).trim())
                    : null;

            const result = await ThongTinNhanTienModel.createOrUpdate({
                gh_ma,
                nh_ma,
                ttnt_gianhang_tentaikhoan,
                ttnt_gianhang_sotaikhoan,
                sepay_webhook_secret: secretMoi
            });

            if (result) delete result.sepay_webhook_secret;

            res.status(200).json({ message: 'Lưu thông tin nhận tiền thành công!', data: result });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // 3. Xóa tài khoản
    delete: async (req, res) => {
        try {
            const { gh_ma } = req.params;
            await ThongTinNhanTienModel.delete(gh_ma);
            res.status(200).json({ message: 'Đã xóa tài khoản nhận tiền.' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = ThongTinNhanTienController;
