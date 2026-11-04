const PhiChiecKhauModel = require('../../models/san/phiChiecKhauModel');

const PhiChiecKhauController = {
  // Lấy dữ liệu cây ngành hàng
  getTableData: async (req, res) => {
    try {
      const stmdt_ma = req.query.stmdt_ma || req.params.stmdt_ma;
      const data = await PhiChiecKhauModel.getTreeWithLatestFee(stmdt_ma);
      res.status(200).json(data);
    } catch (error) { 
      console.error("Lỗi lấy dữ liệu ngành hàng:", error);
      res.status(500).json({ message: error.message }); 
    }
  },

  // Cập nhật phí chiết khấu
  updateFee: async (req, res) => {
    try { 
      const result = await PhiChiecKhauModel.updateFee(req.body);
      res.status(200).json(result); 
    } catch (error) { 
      res.status(500).json({ message: error.message }); 
    }
  }
};

module.exports = PhiChiecKhauController;