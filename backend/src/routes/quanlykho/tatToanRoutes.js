const express = require('express');
const router = express.Router();
const TatToanController = require('../../controllers/quanlykho/tatToanController');
const pool = require('../../config/db');

// 1. Route kiểm tra trạng thái (Polling)
router.get('/trang-thai/:ptt_ma', async (req, res) => {
  try {
    const phieuRes = await pool.query(
      `SELECT ptt_trang_thai_thanh_toan AS trang_thai FROM phieu_tat_toan WHERE ptt_ma = $1`,
      [req.params.ptt_ma]
    );
    
    const qrRes = await pool.query(
      `SELECT qr_ma, qr_loai, qr_trang_thai FROM qr_thanh_toan WHERE ptt_ma = $1`,
      [req.params.ptt_ma]
    );

    if (phieuRes.rows.length === 0) {
      return res.json({ trang_thai: 'KHONG_TIM_THAY', ds_qr: [] });
    }

    res.json({
      trang_thai: phieuRes.rows[0].trang_thai,
      ds_qr: qrRes.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Route hủy phiếu tất toán (nếu chưa thanh toán)
router.delete('/huy/:ptt_ma', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { ptt_ma } = req.params;
    
    const check = await client.query(`SELECT ptt_trang_thai_thanh_toan FROM phieu_tat_toan WHERE ptt_ma = $1`, [ptt_ma]);
    if (check.rows[0]?.ptt_trang_thai_thanh_toan !== 'CHO_THANH_TOAN') {
      throw new Error('Không thể hủy phiếu đã thanh toán!');
    }

    await client.query(`DELETE FROM qr_thanh_toan WHERE ptt_ma = $1`, [ptt_ma]);
    await client.query(`DELETE FROM chitiet_tat_toan WHERE ptt_ma = $1`, [ptt_ma]);
    await client.query(`DELETE FROM phieu_tat_toan WHERE ptt_ma = $1`, [ptt_ma]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Đã hủy phiếu tất toán' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
});

// 3. Các route chính
router.post('/tao-qr', TatToanController.taoPhieuVaQr);
router.get('/:kho_ma', TatToanController.getDuLieuTatToan);
router.post('/', TatToanController.xacNhanTatToan);

module.exports = router;