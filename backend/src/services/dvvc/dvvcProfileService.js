const DvvcProfileModel = require('../../models/dvvc/dvvcProfileModel');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('../../config/secretCrypto');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/dvvc');

const DvvcProfileService = {
    // Trả profile cho trình duyệt: KHÔNG bao giờ trả secret nguyên văn
    getProfile: async (dvvc_ma) => {
        const data = await DvvcProfileModel.getProfile(dvvc_ma);
        if (!data) return data;

        const secret = decrypt(data.sepay_webhook_secret);
        const ketQua = { ...data };
        delete ketQua.sepay_webhook_secret;

        ketQua.sepay_webhook_secret_set = !!secret;
        // Thời điểm lưu secret (null nếu secret có từ trước khi thêm cột này)
        ketQua.sepay_webhook_secret_saved_at =
            data.sepay_webhook_secret_saved_at || null;

        return ketQua;
    },

    updateProfile: async (dvvc_ma, data, file) => {
        const existing = await DvvcProfileModel.getProfile(dvvc_ma);
        if (!existing) throw new Error('Không tìm thấy ĐVVC!');

        let hinhAnhPath = existing.DVVC_HinhAnh;
        if (file) {
            hinhAnhPath = `/uploads/dvvc/${file.filename}`;
            if (existing.DVVC_HinhAnh && existing.DVVC_HinhAnh.startsWith('/uploads/')) {
                const oldFilePath = path.join(__dirname, '../../../public', existing.DVVC_HinhAnh);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
        }

        const updateData = {
            DVVC_Ten: data.DVVC_Ten,
            DVVC_MoTa: data.DVVC_MoTa,
            DVVC_HinhAnh: hinhAnhPath
        };

        return await DvvcProfileModel.updateProfile(dvvc_ma, updateData);
    },

    saveBankAccount: async (dvvc_ma, data) => {
        // Kiểm tra các trường bắt buộc
        if (!data.NganHang_Ma || !data.TTNT_DVVC_SoTaiKhoan || !data.TTNT_DVVC_TenTaiKhoan) {
            throw new Error('Vui lòng nhập đầy đủ thông tin ngân hàng!');
        }
        
        // 🟢 Chuẩn bị dữ liệu để gửi xuống Model
        // - Có nhập secret mới -> mã hoá rồi lưu
        // - Để trống -> null, model giữ nguyên secret cũ
        const secretMoi =
            data.sepay_webhook_secret !== null &&
            data.sepay_webhook_secret !== undefined &&
            String(data.sepay_webhook_secret).trim() !== ''
                ? encrypt(String(data.sepay_webhook_secret).trim())
                : null;

        const bankData = {
            NganHang_Ma: data.NganHang_Ma,
            TTNT_DVVC_SoTaiKhoan: data.TTNT_DVVC_SoTaiKhoan,
            TTNT_DVVC_TenTaiKhoan: data.TTNT_DVVC_TenTaiKhoan,
            sepay_webhook_secret: secretMoi
        };

        const daLuu = await DvvcProfileModel.saveBankAccount(dvvc_ma, bankData);

        // Không trả secret (kể cả bản đã mã hoá) về trình duyệt
        if (daLuu) delete daLuu.sepay_webhook_secret;
        return daLuu;
    },

    deleteBankAccount: async (dvvc_ma) => {
        return await DvvcProfileModel.deleteBankAccount(dvvc_ma);
    },

    changePassword: async (dvvc_ma, oldPassword, newPassword) => {
        const existing = await DvvcProfileModel.getProfile(dvvc_ma);
        if (!existing) throw new Error('Không tìm thấy ĐVVC!');

        const isMatch = await bcrypt.compare(oldPassword, existing.DVVC_HashPass);
        if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng!');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        return await DvvcProfileModel.updatePassword(dvvc_ma, hashedPassword);
    }
};

module.exports = DvvcProfileService;