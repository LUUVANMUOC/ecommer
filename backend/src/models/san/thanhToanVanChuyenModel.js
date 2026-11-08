const pool = require('../../config/db');

const ThanhToanVanChuyenModel = {
  // 1. Lấy danh sách ĐVVC đang nợ tiền
  getDanhSachNo: async () => {
    await ThanhToanVanChuyenModel.donDepPhieuQuaHan();
    const query = `
      SELECT d.dvvc_ma, d.dvvc_ten, COUNT(o.dts_ma) as so_don, SUM(o.dts_tonggiamgiavanchuyen) as tong_tien_no
      FROM donhangtheoshop o
      JOIN donvivanchuyen d ON o.dvvc_ma = d.dvvc_ma
      WHERE o.dts_tonggiamgiavanchuyen > 0
        AND o.dts_ma NOT IN (SELECT dts_ma FROM chitiet_chi_dvvc)
      GROUP BY d.dvvc_ma, d.dvvc_ten
      HAVING SUM(o.dts_tonggiamgiavanchuyen) > 0
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // 2. Lấy chi tiết đơn nợ
  getChiTietNo: async (dvvc_ma) => {
    const query = `
      SELECT dts_ma, dts_tonggiamgiavanchuyen AS tien_ship
      FROM donhangtheoshop
      WHERE dvvc_ma = $1 AND dts_tonggiamgiavanchuyen > 0
        AND dts_ma NOT IN (SELECT dts_ma FROM chitiet_chi_dvvc)
    `;
    const result = await pool.query(query, [dvvc_ma]);
    return result.rows;
  },

  // 3. Tạo phiếu chi
  taoPhieuChi: async (dvvc_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const donHangRes = await client.query(`
        SELECT o.dts_ma, o.dts_tonggiamgiavanchuyen 
        FROM donhangtheoshop o
        WHERE o.dvvc_ma = $1 AND o.dts_tonggiamgiavanchuyen > 0
        AND o.dts_ma NOT IN (SELECT dts_ma FROM chitiet_chi_dvvc)
      `, [dvvc_ma]);

      if (donHangRes.rows.length === 0) throw new Error("Không có đơn nào cần thanh toán");
      const tongTien = donHangRes.rows.reduce((sum, row) => sum + Number(row.dts_tonggiamgiavanchuyen), 0);

      const pcdRes = await client.query(`SELECT pcd_ma FROM phieu_chi_dvvc ORDER BY pcd_ma DESC LIMIT 1`);
      let newPcdMa = 'PCD0000001';
      if (pcdRes.rows.length > 0) {
        const num = parseInt(pcdRes.rows[0].pcd_ma.replace('PCD', ''), 10);
        newPcdMa = 'PCD' + (num + 1).toString().padStart(7, '0');
      }

      await client.query(`INSERT INTO phieu_chi_dvvc (pcd_ma, dvvc_ma, pcd_tong_tien) VALUES ($1, $2, $3)`, [newPcdMa, dvvc_ma, tongTien]);
      for (const row of donHangRes.rows) {
        await client.query(`INSERT INTO chitiet_chi_dvvc (pcd_ma, dts_ma, ccd_so_tien) VALUES ($1, $2, $3)`, [newPcdMa, row.dts_ma, row.dts_tonggiamgiavanchuyen]);
      }
      await client.query(`INSERT INTO qr_chi_dvvc (qr_ma, pcd_ma, qr_so_tien) VALUES ($1, $2, $3)`, [newPcdMa, newPcdMa, tongTien]);

      await client.query('COMMIT');
      return { pcd_ma: newPcdMa, tong_tien: tongTien };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 4. Thông tin ngân hàng
  getBankInfo: async (dvvc_ma) => {
    const query = `
      SELECT tt.ttnt_dvvc_sotaikhoan AS so_tai_khoan, tt.ttnt_dvvc_tentaikhoan AS ten_tai_khoan,
             nh.nhg_ten AS ten_ngan_hang, nh.nhg_ma AS ma_ngan_hang
      FROM thongtinnhantien_dvvc tt
      JOIN nganhang nh ON tt.nganhang_ma = nh.nhg_ma
      WHERE tt.dvvc_ma = $1 LIMIT 1
    `;
    const result = await pool.query(query, [dvvc_ma]);
    return result.rows[0];
  },

  // 5. Hủy phiếu chi
  huyPhieuChi: async (pcd_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM qr_chi_dvvc WHERE pcd_ma = $1`, [pcd_ma]);
      await client.query(`DELETE FROM chitiet_chi_dvvc WHERE pcd_ma = $1`, [pcd_ma]);
      await client.query(`DELETE FROM phieu_chi_dvvc WHERE pcd_ma = $1`, [pcd_ma]);
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 6. Dọn dẹp phiếu quá hạn
  donDepPhieuQuaHan: async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const expiredQuery = `
        SELECT pcd_ma FROM phieu_chi_dvvc 
        WHERE pcd_trang_thai = 'CHO_THANH_TOAN' 
        AND pcd_ngay_tao < NOW() - INTERVAL '5 minutes'
      `;
      const expiredRes = await client.query(expiredQuery);
      
      if (expiredRes.rows.length > 0) {
        const pcdIds = expiredRes.rows.map(r => r.pcd_ma);
        await client.query(`DELETE FROM qr_chi_dvvc WHERE pcd_ma = ANY($1)`, [pcdIds]);
        await client.query(`DELETE FROM chitiet_chi_dvvc WHERE pcd_ma = ANY($1)`, [pcdIds]);
        await client.query(`DELETE FROM phieu_chi_dvvc WHERE pcd_ma = ANY($1)`, [pcdIds]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  },

  // ================= LỊCH SỬ THANH TOÁN =================
  getLichSuAdmin: async () => {
    const query = `
      SELECT p.pcd_ma, p.pcd_ngay_hoan_tat, p.pcd_tong_tien, d.dvvc_ten, d.dvvc_ma
      FROM phieu_chi_dvvc p
      JOIN donvivanchuyen d ON p.dvvc_ma = d.dvvc_ma
      WHERE p.pcd_trang_thai = 'DA_THANH_TOAN'
      ORDER BY p.pcd_ngay_hoan_tat DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  getLichSuDVVC: async (dvvc_ma) => {
    const query = `
      SELECT p.pcd_ma, p.pcd_ngay_hoan_tat, p.pcd_tong_tien
      FROM phieu_chi_dvvc p
      WHERE p.dvvc_ma = $1 AND p.pcd_trang_thai = 'DA_THANH_TOAN'
      ORDER BY p.pcd_ngay_hoan_tat DESC
    `;
    const result = await pool.query(query, [dvvc_ma]);
    return result.rows;
  },

  getChiTietLichSu: async (pcd_ma) => {
    const query = `
      SELECT c.dts_ma, c.ccd_so_tien AS tien_ship
      FROM chitiet_chi_dvvc c
      WHERE c.pcd_ma = $1
    `;
    const result = await pool.query(query, [pcd_ma]);
    return result.rows;
  },
  checkTrangThai: async (pcd_ma) => {
    const query = `SELECT pcd_trang_thai FROM phieu_chi_dvvc WHERE pcd_ma = $1`;
    const result = await pool.query(query, [pcd_ma]);
    return result.rows[0];
  }
};

module.exports = ThanhToanVanChuyenModel;