const TinhModel = require('../../models/san/tinhModel');

const TinhService = {
    getAll: async () => {
        return await TinhModel.getAll();
    },

    getById: async (id) => {
        const item = await TinhModel.getById(id);
        if (!item) throw new Error('Không tìm thấy tỉnh này!');
        return item;
    },

    // [XỬ LÝ CHÍNH] Tự động sinh mã khi thêm mới
    create: async (data) => {
        // 1. Lấy tất cả danh sách hiện tại
        const allItems = await TinhModel.getAll();
        
        // 2. Mặc định mã ban đầu nếu danh sách trống
        let newMa = 'TINH01'; 

        if (allItems.length > 0) {
            let maxNumber = 0;

            // 3. Quét qua danh sách để tìm con số lớn nhất
            allItems.forEach(item => {
                // Hỗ trợ cả trường hợp Postgres trả về chữ hoa hoặc chữ thường
                const idString = item.TH_Ma || item.th_ma; 
                
                if (idString) {
                    // Tách lấy phần số (VD: "TTD05" -> 5)
                    const numberPart = parseInt(idString.replace(/\D/g, ''), 10);
                    
                    // Cập nhật nếu tìm thấy số lớn hơn
                    if (!isNaN(numberPart) && numberPart > maxNumber) {
                        maxNumber = numberPart;
                    }
                }
            });

            // 4. Tính toán mã tiếp theo (VD: max là 5 -> 6 -> "TTD06")
            const nextNumber = maxNumber + 1;
            newMa = `TINH${nextNumber.toString().padStart(2, '0')}`;
        }

        // 5. Gắn mã mới vào dữ liệu và gửi xuống Model để lưu
        const newData = {
            ...data,
            TH_Ma: newMa
        };

        return await TinhModel.create(newData);
    },

    update: async (id, data) => {
        const existing = await TinhModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy tỉnh để cập nhật!');
        return await TinhModel.update(id, data);
    },

    delete: async (id) => {
        const existing = await TinhModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy tỉnh để xóa!');
        return await TinhModel.delete(id);
    }
};

module.exports = TinhService;