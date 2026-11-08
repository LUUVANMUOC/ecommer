const pool = require('../../config/db');
const PhieuKhoModel = require('../quanlykho/phieuKhoModel'); // Import model Phiếu kho

const ShipperTrungChuyenModel = {
  getDonDangTrungChuyen: async (shipper_ma) => {
    const query = `
      SELECT ttc.dts_ma AS "DTS_Ma", ttc.ttc_thoidiemtao AS "ThoiDiemGui", dts.dts_tongtienkhachhangthanhtoan AS "TongTien", gh.gh_ten AS "TenShop", k_di.kho_ten AS "Kho_Di_Ten", k_den.kho_ten AS "Kho_Den_Ten", ttnh.ttnh_diachisnapshot AS "DiaChiGiao", ttnh.ttnh_ten AS "TenKhach", ttnh.ttnh_sdt AS "SdtKhach"
      FROM thongtintrungchuyen ttc JOIN donhangtheoshop dts ON ttc.dts_ma = dts.dts_ma JOIN gianhang gh ON dts.gh_ma = gh.gh_ma JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE ttc.shipper_trungchuyen_ma = $1 AND ttc.ttc_thoidiemdi IS NULL
        AND EXISTS (SELECT 1 FROM phieu_kho pk WHERE pk.dts_ma = ttc.dts_ma AND pk.pk_ly_do = 'TRUNG_CHUYEN_DI' AND pk.pk_trangthai = 'DA_XAC_NHAN')
      ORDER BY ttc.ttc_thoidiemtao ASC
    `;
    const res = await pool.query(query, [shipper_ma]);
    return res.rows;
  },
  getLichSu: async (shipper_ma) => {
    const res = await pool.query(`SELECT ttc.dts_ma AS "DTS_Ma", ttc.ttc_thoidiemdi AS "ThoiGian", k_di.kho_ten || ' → ' || k_den.kho_ten AS "TenShop", ttc.ttc_hinhanh AS "HinhAnh" FROM thongtintrungchuyen ttc JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma JOIN kho k_den ON ttc.kho_den_ma = k_den.kho_ma WHERE ttc.shipper_trungchuyen_ma = $1 AND ttc.ttc_thoidiemdi IS NOT NULL ORDER BY ttc.ttc_thoidiemdi DESC`, [shipper_ma]);
    return res.rows;
  },
  giaoHangToiKho: async (dts_ma, shipper_ma, hinhanh, ghichu) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const query = `UPDATE thongtintrungchuyen SET ttc_thoidiemdi = NOW(), ttc_hinhanh = $1, ttc_ghichu = $2 WHERE dts_ma = $3 AND shipper_trungchuyen_ma = $4 AND ttc_thoidiemdi IS NULL RETURNING *`;
      const res = await client.query(query, [hinhanh, ghichu || null, dts_ma, shipper_ma]);
      
      if (res.rows.length === 0) throw new Error("Đơn không tồn tại hoặc đã giao!");

      // Shipper giao xong -> Tạo phiếu NHẬP/TRUNG_CHUYEN_DEN trạng thái CHỜ XÁC NHẬN cho thủ kho
      const ttc = res.rows[0];
      await PhieuKhoModel.taoPhieu(client, {
        kho_ma: ttc.kho_den_ma, dts_ma, pk_loai: 'NHAP', pk_ly_do: 'TRUNG_CHUYEN_DEN', shipper_ma, pk_trangthai: 'CHO_XAC_NHAN',
      });

      await client.query('COMMIT');
      return ttc;
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
};
module.exports = ShipperTrungChuyenModel;