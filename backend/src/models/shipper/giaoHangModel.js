const pool = require('../../config/db');

const GiaoHangModel = {
  getDonCanGiao: async (shipper_ma) => {
    const query = `
      SELECT dts.dts_ma AS "DTS_Ma", dts.dts_tongtienkhachhangthanhtoan AS "TongTien", ttnh.ttnh_ten AS "TenKhach", ttnh.ttnh_sdt AS "SdtKhach", ttnh.ttnh_diachisnapshot AS "DiaChiGiao", ttnh.ttnh_ghichu AS "GhiChuKhach", gh.gh_ten AS "TenShop"
      FROM thongtingiaohang ttgh JOIN donhangtheoshop dts ON ttgh.dts_ma = dts.dts_ma JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      WHERE ttgh.shipper_ma = $1 AND ttgh.ttgh_thoidiem IS NULL 
        AND (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) = 'TTDH04'
        AND EXISTS (SELECT 1 FROM phieu_kho pk WHERE pk.dts_ma = dts.dts_ma AND pk.pk_ly_do = 'GIAO_LSP03' AND pk.pk_trangthai = 'DA_XAC_NHAN')
      ORDER BY ttgh.ttgh_thoidiemtao ASC
    `;
    const res = await pool.query(query, [shipper_ma]);
    for (const order of res.rows) {
      const itemsRes = await pool.query(`SELECT sp.sp_ten AS "TenSanPham", ctsp.ctsp_ten AS "TenPhanLoai", ctdh.ctdh_soluong AS "SoLuong" FROM chitietdonhang ctdh JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma WHERE ctdh.dts_ma = $1`, [order.DTS_Ma]);
      order.items = itemsRes.rows;
    }
    return res.rows;
  },
  getLichSu: async (shipper_ma) => {
    const res = await pool.query(`SELECT dts.dts_ma AS "DTS_Ma", ttgh.ttgh_thoidiem AS "ThoiGian", ttnh.ttnh_ten AS "TenShop", ttgh.ttgh_hinhanh AS "HinhAnh" FROM thongtingiaohang ttgh JOIN donhangtheoshop dts ON ttgh.dts_ma = dts.dts_ma JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma WHERE ttgh.shipper_ma = $1 AND ttgh.ttgh_thoidiem IS NOT NULL ORDER BY ttgh.ttgh_thoidiem DESC`, [shipper_ma]);
    return res.rows;
  },
  giaoHangThanhCong: async (dts_ma, shipper_ma, hinhanh, ghichu) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updateRes = await client.query(`UPDATE thongtingiaohang SET ttgh_thoidiem = NOW(), ttgh_hinhanh = $1, ttgh_ghichu = $2 WHERE dts_ma = $3 AND shipper_ma = $4 AND ttgh_thoidiem IS NULL RETURNING *`, [hinhanh, ghichu || null, dts_ma, shipper_ma]);
      if (updateRes.rowCount === 0) throw new Error("Đơn hàng không tồn tại hoặc đã được giao rồi!");
      
      // Đã xóa việc tự động chuyển TTDH05 và thanh toán ở đây. 
      // Chờ Khách hàng bấm xác nhận thì mới chuyển.
      
      await client.query('COMMIT');
      return { message: "Giao hàng thành công, chờ khách xác nhận!" };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
};
module.exports = GiaoHangModel;