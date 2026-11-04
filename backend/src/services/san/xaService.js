const XaModel = require('../../models/san/xaModel');

const XaService = {
    getAll: async () => {
        return await XaModel.getAll();
    },

    getById: async (id) => {
        const item = await XaModel.getById(id);
        if (!item) throw new Error('Không tìm thấy Xã này!');
        return item;
    },

    create: async (data) => {
        const allItems = await XaModel.getAll();
        
        // Sửa lại mã mặc định thành XA01
        let newMa = 'XA01'; 

        if (allItems.length > 0) {
            let maxNumber = 0;
            allItems.forEach(item => {
                // Quét đúng trường XA_Ma của bảng Xã
                const idString = item.XA_Ma || item.xa_ma; 
                
                if (idString) {
                    const numberPart = parseInt(idString.replace(/\D/g, ''), 10);
                    if (!isNaN(numberPart) && numberPart > maxNumber) {
                        maxNumber = numberPart;
                    }
                }
            });
            const nextNumber = maxNumber + 1;
            // Ghép thành XA01, XA02...
            newMa = `XA${nextNumber.toString().padStart(2, '0')}`;
        }

        // Gắn mã mới, đồng thời giữ nguyên TH_Ma do Frontend gửi lên
        const newData = {
            ...data,
            XA_Ma: newMa
        };

        return await XaModel.create(newData);
    },

    update: async (id, data) => {
        const existing = await XaModel.getById(id);
        // Sửa lại thông báo lỗi thành Xã
        if (!existing) throw new Error('Không tìm thấy Xã để cập nhật!');
        return await XaModel.update(id, data);
    },

    delete: async (id) => {
        const existing = await XaModel.getById(id);
        // Sửa lại thông báo lỗi thành Xã
        if (!existing) throw new Error('Không tìm thấy Xã để xóa!');
        return await XaModel.delete(id);
    }
};

module.exports = XaService;