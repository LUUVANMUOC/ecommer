const express = require('express');
const router = express.Router();
const TatToanController = require('../../controllers/quanlykho/tatToanController');
const TatToanModel = require('../../models/quanlykho/tatToanModel');
const pool = require('../../config/db');

// 1. Route kiểm tra trạng thái (Polling)
router.get('/trang-thai/:ptt_ma', async (req, res) => {
  try {
    const phieuRes = await pool.query(
      `SELECT ptt_trang_thai_thanh_toan AS trang_thai,
              ptt_loai,
              ptt_tong_tien_dvvc,
              ptt_tong_tien_san,
              ptt_tong_tien_shop
       FROM phieu_tat_toan WHERE ptt_ma = $1`,
      [req.params.ptt_ma]
    );

    if (phieuRes.rows.length === 0) {
      return res.json({ trang_thai: 'KHONG_TIM_THAY', ds_qr: [] });
    }

    const qrRes = await pool.query(
      `SELECT qr_ma, qr_loai, qr_so_tien, qr_trang_thai, gh_ma, dvvc_ma
       FROM qr_thanh_toan
       WHERE ptt_ma = $1
       ORDER BY qr_loai, qr_ma`,
      [req.params.ptt_ma]
    );

    const dsQr = qrRes.rows.map((qr) => ({
      ...qr,
      qr_so_tien: Number(qr.qr_so_tien),
    }));
    const daThu = dsQr
      .filter((qr) => qr.qr_trang_thai === 'DA_THANH_TOAN')
      .reduce((sum, qr) => sum + qr.qr_so_tien, 0);
    const tongTien = dsQr
      .filter((qr) => qr.qr_trang_thai !== 'HUY')
      .reduce((sum, qr) => sum + qr.qr_so_tien, 0);

    res.json({
      trang_thai: phieuRes.rows[0].trang_thai,
      ptt_loai: phieuRes.rows[0].ptt_loai,
      tong_tien_dvvc: Number(phieuRes.rows[0].ptt_tong_tien_dvvc || 0),
      tong_tien: tongTien,
      da_thu: daThu,
      so_qr: dsQr.filter((qr) => qr.qr_trang_thai !== 'HUY').length,
      so_qr_da_tra: dsQr.filter((qr) => qr.qr_trang_thai === 'DA_THANH_TOAN')
        .length,
      ds_qr: dsQr,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Huỷ đợt tất toán: chỉ đánh dấu HUY, giữ lại các QR đã thu.
router.delete('/huy/:ptt_ma', async (req, res) => {
  try {
    const result = await TatToanModel.huyDot(req.params.ptt_ma);
    res.status(200).json({
      message:
        result.da_thu > 0
          ? 'Đã huỷ đợt tất toán. Các khoản đã thu vẫn được giữ lại.'
          : 'Đã huỷ đợt tất toán.',
      ...result,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. Các route chính
router.post('/tao-qr', TatToanController.taoPhieuVaQr);

// 4. Lịch sử và chi tiết tất toán (đặt trước '/:kho_ma' để không bị bắt nhầm)
router.get('/lich-su/:kho_ma', TatToanController.getLichSuTatToan);
router.get('/chi-tiet/:ptt_ma', TatToanController.getChiTietPhieuTatToan);

// 5. Tất toán cước vận chuyển còn tồn (đặt trước '/:kho_ma' để không bị bắt nhầm)
router.get('/cuoc-ton/:kho_ma', TatToanController.getDuLieuCuocTon);
router.post('/cuoc-ton/tao-qr', TatToanController.taoPhieuCuocTon);

router.get('/:kho_ma', TatToanController.getDuLieuTatToan);
router.post('/', TatToanController.xacNhanTatToan);

module.exports = router;