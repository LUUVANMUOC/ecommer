const pool = require('../../config/db');
const PhieuKhoModel = require('./phieuKhoModel');

const PhanCongGiaoHangModel = {
  getDonChoPhanCong: async (kho_ma) => {
    const res = await pool.query(`
      SELECT dts.dts_ma AS "DTS_Ma", dts.dts_tongtienkhachhangthanhtoan AS "TongTien", gh.gh_ten AS "TenShop", ttnh.ttnh_diachisnapshot AS "DiaChiGiao", ttnh.ttnh_sdt AS "SdtKhach", ttnh.ttnh_ten AS "TenKhach"
      FROM donhangtheoshop dts JOIN thongtintrungchuyen ttc ON dts.dts_ma = ttc.dts_ma JOIN gianhang gh ON dts.gh_ma = gh.gh_ma JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE ttc.kho_den_ma = $1 AND ttc.ttc_thoidiemden IS NOT NULL AND (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) = 'TTDH03' AND NOT EXISTS (SELECT 1 FROM thongtingiaohang WHERE dts_ma = dts.dts_ma) ORDER BY dts.dts_ma ASC
    `, [kho_ma]);
    return res.rows;
  },
  getShippersLSP03: async (kho_ma) => {
    const res = await pool.query(`SELECT shipper_ma AS "Shipper_Ma", shipper_ten AS "Shipper_Ten", shipper_sdt AS "Shipper_SDT" FROM shipper WHERE kho_ma = $1 AND lsp_ma = 'LSP03'`, [kho_ma]);
    return res.rows;
  },
  phanCongGiaoHang: async (dts_ma, shipper_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const checkRes = await client.query(`SELECT 1 FROM thongtingiaohang WHERE dts_ma = $1`, [dts_ma]);
      if (checkRes.rows.length > 0) throw new Error("Đơn hàng này đã được phân công!");
      
      await client.query(`INSERT INTO thongtingiaohang (dts_ma, shipper_ma) VALUES ($1, $2)`, [dts_ma, shipper_ma]);
      
      // Tạo phiếu xuất trạng thái CHỜ XÁC NHẬN (Không chèn TTDH04 ở đây nữa)
      const sRes = await client.query(`SELECT kho_ma FROM shipper WHERE shipper_ma = $1`, [shipper_ma]);
      if (sRes.rows.length === 0) throw new Error("Không tìm thấy shipper!");
      
      await PhieuKhoModel.taoPhieu(client, {
        kho_ma: sRes.rows[0].kho_ma, dts_ma, pk_loai: 'XUAT', pk_ly_do: 'GIAO_LSP03', shipper_ma, pk_trangthai: 'CHO_XAC_NHAN',
      });
      await client.query('COMMIT');
      return { message: "Phân công thành công, chờ thủ kho xuất hàng!" };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
};
module.exports = PhanCongGiaoHangModel;