// backend/src/services/sanThuongMaiService.js
const SanThuongMaiModel = require('../../models/san/sanThuongMaiModel');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../../config/secretCrypto');

const SanThuongMaiService = {
    // Trả profile cho trình duyệt: KHÔNG bao giờ trả secret / hash mật khẩu
    getProfile: async (STMDT_Ma) => {
        const data = await SanThuongMaiModel.getProfile(STMDT_Ma);
        if (!data) return data;

        const secret = decrypt(data.sepay_webhook_secret);
        const ketQua = { ...data };
        delete ketQua.sepay_webhook_secret;
        delete ketQua.STMDT_HashPass;

        ketQua.sepay_webhook_secret_set = !!secret;
        // Thời điểm lưu secret (null nếu secret có từ trước khi thêm cột này)
        ketQua.sepay_webhook_secret_saved_at =
            data.sepay_webhook_secret_saved_at || null;

        return ketQua;
    },

    updateProfile: async (STMDT_Ma, data) => {
        return await SanThuongMaiModel.updateProfile(STMDT_Ma, data);
    },

    saveBankAccount: async (STMDT_Ma, data) => {
        if (!data.NganHang_Ma || !data.TTNT_STMDT_SoTaiKhoan || !data.TTNT_STMDT_TenTaiKhoan) {
            throw new Error('Vui lòng nhập đầy đủ thông tin ngân hàng!');
        }

        // Có nhập secret mới -> mã hoá rồi lưu; để trống -> model giữ secret cũ
        const secretMoi =
            data.sepay_webhook_secret !== null &&
            data.sepay_webhook_secret !== undefined &&
            String(data.sepay_webhook_secret).trim() !== ''
                ? encrypt(String(data.sepay_webhook_secret).trim())
                : null;

        const daLuu = await SanThuongMaiModel.saveBankAccount(STMDT_Ma, {
            NganHang_Ma: data.NganHang_Ma,
            TTNT_STMDT_SoTaiKhoan: data.TTNT_STMDT_SoTaiKhoan,
            TTNT_STMDT_TenTaiKhoan: data.TTNT_STMDT_TenTaiKhoan,
            sepay_webhook_secret: secretMoi
        });

        // Không trả secret (kể cả bản đã mã hoá) về trình duyệt
        if (daLuu) delete daLuu.sepay_webhook_secret;
        return daLuu;
    },

    deleteBankAccount: async (STMDT_Ma) => {
        return await SanThuongMaiModel.deleteBankAccount(STMDT_Ma);
    },

    changePassword: async (STMDT_Ma, oldPassword, newPassword) => {
        const existing = await SanThuongMaiModel.getProfile(STMDT_Ma);
        if (!existing) throw new Error('Không tìm thấy Sàn!');

        // Lưu ý: existing.STMDT_HashPass đã được alias ở Model
        const isMatch = await bcrypt.compare(oldPassword, existing.STMDT_HashPass);
        if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng!');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        return await SanThuongMaiModel.updatePassword(STMDT_Ma, hashedPassword);
    }
};

module.exports = SanThuongMaiService;