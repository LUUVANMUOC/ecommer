const DanhMucSanPhamModel = require('../../models/gianhang/danhMucSanPhamModel');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads/categories');

const DanhMucSanPhamService = {
    getByGianHang: async (gh_ma) => {
        return await DanhMucSanPhamModel.getByGianHang(gh_ma);
    },

    create: async (data) => {
        let newMa = 'DMSP01';
        const latestMa = await DanhMucSanPhamModel.getLatestMa();
        
        if (latestMa) {
            const stringMa = latestMa.toString().toUpperCase();
            const currentNumber = parseInt(stringMa.replace('DMSP', ''), 10);
            if (!isNaN(currentNumber)) {
                newMa = 'DMSP' + (currentNumber + 1).toString().padStart(2, '0');
            }
        }

        const newData = {
            dmsp_ma: newMa,
            dmsp_ten: data.dmsp_ten,
            dmsp_mota: data.dmsp_mota,
            dmsp_hinhanh: data.dmsp_hinhanh || null,
            gh_ma: data.gh_ma
        };

        return await DanhMucSanPhamModel.create(newData);
    },

    update: async (id, data) => {
        const existing = await DanhMucSanPhamModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy danh mục!');

        if (data.dmsp_hinhanh && existing.dmsp_hinhanh && data.dmsp_hinhanh !== existing.dmsp_hinhanh) {
            try {
                const oldFileName = path.basename(existing.dmsp_hinhanh);
                const oldFilePath = path.join(UPLOAD_DIR, oldFileName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (error) {
                console.error("Lỗi khi xóa ảnh cũ:", error);
            }
        }

        const updateData = {
            dmsp_ten: data.dmsp_ten,
            dmsp_mota: data.dmsp_mota,
            dmsp_hinhanh: data.dmsp_hinhanh || existing.dmsp_hinhanh || null
        };

        return await DanhMucSanPhamModel.update(id, updateData);
    },

    delete: async (id) => {
        const existing = await DanhMucSanPhamModel.getById(id);
        if (!existing) throw new Error('Không tìm thấy danh mục!');

        const deletedRecord = await DanhMucSanPhamModel.delete(id);

        if (existing.dmsp_hinhanh) {
            try {
                const fileName = path.basename(existing.dmsp_hinhanh);
                const filePath = path.join(UPLOAD_DIR, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error("Lỗi khi xóa file ảnh:", error);
            }
        }
        return deletedRecord;
    }
};

module.exports = DanhMucSanPhamService;