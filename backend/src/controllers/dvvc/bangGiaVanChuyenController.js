// backend/src/controllers/dvvc/bangGiaVanChuyenController.js
const Model = require('../../models/dvvc/bangGiaVanChuyenModel');

const BangGiaVanChuyenController = {
  getFormData: async (req, res) => {
    try {
      const [khoiLuong, khuVuc, tuyen] = await Promise.all([
        Model.getKhoiLuong(),
        Model.getKhuVuc(),
        Model.getTuyen()
      ]);
      res.json({ khoiLuong, khuVuc, tuyen });
    } catch (error) { 
      res.status(500).json({ message: error.message }); 
    }
  },

  getBangGia: async (req, res) => {
    try {
      const data = await Model.getBangGia(req.params.dvvc_ma);
      res.json(data);
    } catch (error) { 
      res.status(500).json({ message: error.message }); 
    }
  },

  updateGia: async (req, res) => {
    try {
      const data = await Model.updateGia(req.body);
      res.json({ message: 'Cập nhật giá thành công', data });
    } catch (error) { 
      res.status(400).json({ message: error.message }); 
    }
  },

  // ✅ Cập nhật: Tự động sinh mã KL01, KL02... trước khi lưu
  createKhoiLuong: async (req, res) => {
    try { 
      let newMa = 'KL01';
      const latest = await Model.getLatestMa();
      
      if (latest) {
        const num = parseInt(latest.substring(2), 10) + 1;
        newMa = 'KL' + num.toString().padStart(2, '0');
      }
      
      const dataToSave = { ...req.body, klkh_ma: newMa };
      const data = await Model.createKhoiLuong(dataToSave);
      res.json(data); 
    } catch (err) { 
      res.status(400).json({ message: err.message }); 
    }
  },

  updateKhoiLuong: async (req, res) => {
    try { 
      res.json(await Model.updateKhoiLuong(req.params.id, req.body)); 
    } catch (err) { 
      res.status(400).json({ message: err.message }); 
    }
  },
  
  deleteKhoiLuong: async (req, res) => {
    try {
      await Model.deleteKhoiLuong(req.params.id);
      res.json({ message: 'Xóa thành công' });
    } catch (err) { 
      res.status(400).json({ message: 'Không thể xóa vì đã có dữ liệu giá tham chiếu tới khối lượng này!' }); 
    }
  }
};

module.exports = BangGiaVanChuyenController;