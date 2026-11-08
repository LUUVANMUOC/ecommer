const pool = require('../../config/db');
const PhieuKhoModel = require('./phieuKhoModel');

const TrungChuyenModel = {
  getDonChoGui: async (kho_di_ma) => {
    const query = `
      SELECT dts.dts_ma AS "DTS_Ma", dts.dts_tongtienkhachhangthanhtoan AS "TongTien", gh.gh_ten AS "TenShop", dc_shop.dc_mota AS "DiaChiLayHang", ttnh.ttnh_diachisnapshot AS "DiaChiGiao", k_den.kho_ma AS "Kho_Den_Ma", k_den.kho_ten AS "Kho_Den_Ten"
      FROM donhangtheoshop dts
      JOIN thongtinlayhang ttlh ON dts.dts_ma = ttlh.dts_ma JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma JOIN gianhang gh ON dts.gh_ma = gh.gh_ma JOIN diachi dc_shop ON dts.dc_layhangma = dc_shop.dc_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma JOIN diachi dc_kh ON ttnh.dc_ma = dc_kh.dc_ma
      JOIN kho k_den ON dc_kh.xa_ma = (SELECT xa_ma FROM diachi WHERE dc_ma = k_den.dc_ma)
      WHERE s.kho_ma = $1 AND ttlh.ttlh_thoidiem IS NOT NULL
        AND (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) = 'TTDH03'
        AND NOT EXISTS (SELECT 1 FROM thongtintrungchuyen WHERE dts_ma = dts.dts_ma)
        AND EXISTS (SELECT 1 FROM phieu_kho WHERE dts_ma = dts.dts_ma AND pk_ly_do = 'TU_LSP01' AND pk_trangthai = 'DA_XAC_NHAN')
      ORDER BY dts.dts_ngaylap ASC
    `;
    const res = await pool.query(query, [kho_di_ma]);
    return res.rows;
  },

  getShippersLSP02: async (kho_di_ma) => {
    const res = await pool.query(`SELECT shipper_ma AS "Shipper_Ma", shipper_ten AS "Shipper_Ten", shipper_sdt AS "Shipper_SDT" FROM shipper WHERE kho_ma = $1 AND lsp_ma = 'LSP02'`, [kho_di_ma]);
    return res.rows;
  },

  guiTrungChuyen: async (data) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(`INSERT INTO thongtintrungchuyen (dts_ma, shipper_trungchuyen_ma, kho_di_ma, kho_den_ma, ttc_ghichu) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [data.dts_ma, data.shipper_trungchuyen_ma, data.kho_di_ma, data.kho_den_ma, data.ghichu || null]);
      
      // Phiếu xuất ở trạng thái CHỜ XÁC NHẬN
      await PhieuKhoModel.taoPhieu(client, {
        kho_ma: data.kho_di_ma, dts_ma: data.dts_ma, pk_loai: 'XUAT', pk_ly_do: 'TRUNG_CHUYEN_DI', shipper_ma: data.shipper_trungchuyen_ma, pk_trangthai: 'CHO_XAC_NHAN',
      });
      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },

  getDonChoNhan: async (kho_den_ma) => {
    const res = await pool.query(`
      SELECT ttc.dts_ma AS "DTS_Ma", ttc.ttc_thoidiemtao AS "ThoiDiemGui", dts.dts_tongtienkhachhangthanhtoan AS "TongTien", gh.gh_ten AS "TenShop", s.shipper_ten AS "TenShipperGui", s.shipper_sdt AS "SdtShipperGui", k_di.kho_ten AS "Kho_Di_Ten", ttnh.ttnh_diachisnapshot AS "DiaChiGiao"
      FROM thongtintrungchuyen ttc JOIN donhangtheoshop dts ON ttc.dts_ma = dts.dts_ma JOIN gianhang gh ON dts.gh_ma = gh.gh_ma JOIN shipper s ON ttc.shipper_trungchuyen_ma = s.shipper_ma JOIN kho k_di ON ttc.kho_di_ma = k_di.kho_ma JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE ttc.kho_den_ma = $1 AND ttc.ttc_thoidiemdi IS NOT NULL AND ttc.ttc_thoidiemden IS NULL ORDER BY ttc.ttc_thoidiemdi ASC
    `, [kho_den_ma]);
    return res.rows;
  },

  nhanHang: async (dts_ma, kho_den_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Chỉ cập nhật thời gian nhận, KHÔNG tạo phiếu (vì phiếu do Thủ kho duyệt trên giao diện)
      const res = await client.query(`UPDATE thongtintrungchuyen SET ttc_thoidiemden = NOW() WHERE dts_ma = $1 AND kho_den_ma = $2 AND ttc_thoidiemden IS NULL RETURNING *`, [dts_ma, kho_den_ma]);
      await client.query('COMMIT');
      return res.rows.length > 0 ? res.rows[0] : null;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
};
module.exports = TrungChuyenModel;