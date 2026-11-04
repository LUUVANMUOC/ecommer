const SanPhamModel = require('../../models/gianhang/sanPhamModel');

const SanPhamService = {
    getByGianHang: async (gh_ma) => {
        return await SanPhamModel.getByGianHang(gh_ma);
    },

    create: async (data) => {
        let newMa = 'SP01';
        const latestMa = await SanPhamModel.getLatestMa();
        
        if (latestMa) {
            const currentNumber = parseInt(latestMa.replace('SP', ''), 10);
            newMa = 'SP' + (currentNumber + 1).toString().padStart(2, '0');
        }

        const newData = {
            sp_ma: newMa,
            sp_ten: data.sp_ten,
            sp_mota: data.sp_mota,
            gh_ma: data.gh_ma,
            th_ma: data.th_ma,
            dmsp_ma: data.dmsp_ma
        };

        return await SanPhamModel.create(newData);
    },

    update: async (id, data) => {
        const existing = await SanPhamModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy sản phẩm!');
        
        return await SanPhamModel.update(id, data);
    },

    delete: async (id) => {
        const existing = await SanPhamModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy sản phẩm!');
        
        return await SanPhamModel.delete(id);
    }
};

module.exports = SanPhamService;