const pool = require('../../config/db');
const PhieuKhoModel = require('./phieuKhoModel');

const TrungChuyenModel = {
  getDonChoGui: async (kho_di_ma) => {
    const query = `
      SELECT dts.dts_ma AS "DTS_Ma", dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        gh.gh_ten AS "TenShop", dc_shop.dc_mota AS "DiaChiLayHang",
        x_shop.xa_ten AS "Xa_LayHang", t_shop.tinh_ten AS "Tinh_LayHang",
        ttnh.ttnh_ten AS "TenKhach", ttnh.ttnh_diachisnapshot AS "DiaChiGiao",

        k_di.kho_ma AS "Kho_Di_Ma", k_di.kho_ten AS "Kho_Di_Ten",
        dc_di.dc_mota AS "Kho_Di_DiaChi", x_di.xa_ten AS "Kho_Di_Xa", t_di.tinh_ten AS "Kho_Di_Tinh",

        k_den.kho_ma AS "Kho_Den_Ma", k_den.kho_ten AS "Kho_Den_Ten",
        dc_den.dc_mota AS "Kho_Den_DiaChi", x_den.xa_ten AS "Kho_Den_Xa", t_den.tinh_ten AS "Kho_Den_Tinh"
      FROM donhangtheoshop dts
      JOIN thongtinlayhang ttlh ON dts.dts_ma = ttlh.dts_ma JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma JOIN gianhang gh ON dts.gh_ma = gh.gh_ma JOIN diachi dc_shop ON dts.dc_layhangma = dc_shop.dc_ma
      LEFT JOIN xaphuong x_shop ON dc_shop.xa_ma = x_shop.xa_ma
      LEFT JOIN tinhtp t_shop ON x_shop.tinh_ma = t_shop.tinh_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma JOIN diachi dc_kh ON ttnh.dc_ma = dc_kh.dc_ma
      JOIN kho k_den ON dc_kh.xa_ma = (SELECT xa_ma FROM diachi WHERE dc_ma = k_den.dc_ma)
      JOIN kho k_di ON k_di.kho_ma = $1
      LEFT JOIN diachi dc_di ON k_di.dc_ma = dc_di.dc_ma
      LEFT JOIN xaphuong x_di ON dc_di.xa_ma = x_di.xa_ma
      LEFT JOIN tinhtp t_di ON x_di.tinh_ma = t_di.tinh_ma
      LEFT JOIN diachi dc_den ON k_den.dc_ma = dc_den.dc_ma
      LEFT JOIN xaphuong x_den ON dc_den.xa_ma = x_den.xa_ma
      LEFT JOIN tinhtp t_den ON x_den.tinh_ma = t_den.tinh_ma
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
      // Guard: chỉ chèn khi đơn CHƯA có thông tin trung chuyển (chống double-click / 2 người cùng bấm)
      const res = await client.query(
        `INSERT INTO thongtintrungchuyen (dts_ma, shipper_trungchuyen_ma, kho_di_ma, kho_den_ma, ttc_ghichu)
         SELECT $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::text
         WHERE NOT EXISTS (SELECT 1 FROM thongtintrungchuyen WHERE dts_ma = $1::varchar)
         RETURNING *`,
        [data.dts_ma, data.shipper_trungchuyen_ma, data.kho_di_ma, data.kho_den_ma, data.ghichu || null]
      );
      if (res.rows.length === 0) {
        throw new Error("Đơn hàng này đã được gửi trung chuyển!");
      }

      // Phiếu xuất ở trạng thái CHỜ XÁC NHẬN
      await PhieuKhoModel.taoPhieu(client, {
        kho_ma: data.kho_di_ma, dts_ma: data.dts_ma, pk_loai: 'XUAT', pk_ly_do: 'TRUNG_CHUYEN_DI', shipper_ma: data.shipper_trungchuyen_ma, pk_trangthai: 'CHO_XAC_NHAN',
      });
      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
};
module.exports = TrungChuyenModel;