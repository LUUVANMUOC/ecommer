const TatToanService = require('../../services/quanlykho/tatToanService');

const TatToanController = {
  getDuLieuTatToan: async (req, res) => {
    try {
      const data = await TatToanService.getDuLieuTatToan(req.params.kho_ma);
      res.status(200).json(data);
    } catch (error) { 
      res.status(500).json({ message: error.message }); 
    }
  },
  
  xacNhanTatToan: async (req, res) => {
    try {
      const result = await TatToanService.xacNhanTatToan(req.body.kho_ma, req.body);
      res.status(200).json(result);
    } catch (error) { 
      res.status(400).json({ message: error.message }); 
    }
  },
  
  // Chỉ giữ lại 1 hàm taoPhieuVaQr duy nhất
  taoPhieuVaQr: async (req, res) => {
    try {
      const result = await TatToanService.taoPhieuVaQr(req.body.kho_ma, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  chiTienHangLoat: async (req, res) => {
  try {
    const ketQua = await SepayPayoutService.payoutChoShop();
    const thanhCong = ketQua.filter(k => k.success).length;
    res.status(200).json({ message: 'Hoàn tất', thanhCong, chiTiet: ketQua });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
};

module.exports = TatToanController;