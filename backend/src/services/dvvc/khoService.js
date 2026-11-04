const KhoModel = require('../../models/dvvc/khoModel');
const bcrypt = require('bcryptjs');

const KhoService = {
    // ... (giữ nguyên các hàm khác)
    
    create: async (dvvc_ma, data) => {
        // Sinh mật khẩu ngẫu nhiên 6 ký tự IN HOA (giống shipper)
        const plainPassword = Math.random().toString(36).slice(-6).toUpperCase();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        const dataWithPass = {
            ...data,
            Kho_HashPass: hashedPassword
        };

        const result = await KhoModel.createKho(dvvc_ma, dataWithPass);
        
        // Trả về kèm mật khẩu gốc để hiển thị 1 lần cho DVVC
        return { ...result, PlainPassword: plainPassword };
    },

    // ... (giữ nguyên update, delete, getAll)
};

module.exports = KhoService;