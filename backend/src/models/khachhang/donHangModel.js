const pool = require('../../config/db');

const DonHangModel = {
  getOrdersByCustomer: async (kh_ma) => {
    // 1. Lấy danh sách đơn hàng tổng
    const orderQuery = `
      SELECT 
        dm_ma AS "DM_Ma", 
        dm_ngaylap AS "NgayLap", 
        dm_tongtien AS "TongTien", 
        ttnh_diachisnapshot AS "DiaChiNhan"
      FROM donhangkhachmua dm
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE dm.kh_ma = $1
      ORDER BY dm.dm_ngaylap DESC
    `;
    const ordersRes = await pool.query(orderQuery, [kh_ma]);
    const orders = ordersRes.rows;

    // 2. Lấy chi tiết từng đơn hàng con (theo Shop) và trạng thái mới nhất
    for (let order of orders) {
      const shopQuery = `
        SELECT 
          dts.dts_ma AS "DTS_Ma",
          dts.dts_tongtienhang AS "TongTienHang",
          dts.dts_tienvanchuyen AS "TienVanChuyen",
          dts.dts_tongtienkhachhangthanhtoan AS "TongThanhToan",
          gh.gh_ten AS "TenShop",
          gh.gh_hinhanh AS "HinhShop",
          (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai"
        FROM donhangtheoshop dts
        JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
        WHERE dts.dm_ma = $1
      `;
      const shopRes = await pool.query(shopQuery, [order.DM_Ma]);
      
      // Lấy sản phẩm của từng đơn shop
      for (let shop of shopRes.rows) {
        const itemQuery = `
          SELECT 
            ctsp.ctsp_ma AS "Ctsp_Ma",
            sp.sp_ten AS "TenSanPham",
            ctsp.ctsp_ten AS "TenPhanLoai",
            ctsp.ctsp_gianban AS "GiaBan",
            ctdh.ctdh_soluong AS "SoLuong",
            (SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY hasp_laanhchinh DESC LIMIT 1) AS "Image"
          FROM chitietdonhang ctdh
          JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma
          JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
          WHERE ctdh.dts_ma = $1
        `;
        const itemRes = await pool.query(itemQuery, [shop.DTS_Ma]);
        shop.items = itemRes.rows;
      }
      order.shops = shopRes.rows;
    }
    

    return orders;
  },
  getLatestStatus: async (client, dts_ma) => {
    const res = await client.query(`
      SELECT ttdh_ma FROM chitiettrangthaidonhang 
      WHERE dts_ma = $1 ORDER BY ctttdh_thoidiem DESC LIMIT 1
    `, [dts_ma]);
    return res.rows[0]?.ttdh_ma;
  },

  // ✅ Hàm xử lý hủy đơn hàng
  cancelOrder: async (dts_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Kiểm tra trạng thái hiện tại
      const currentStatus = await DonHangModel.getLatestStatus(client, dts_ma);
      if (currentStatus !== 'TTDH01') {
        throw new Error("Chỉ có thể hủy đơn hàng đang ở trạng thái 'Chờ Xác Nhận'.");
      }

      // 2. Cập nhật trạng thái đơn thành TTDH06 (Đã Hủy)
      await client.query(`
        INSERT INTO chitiettrangthaidonhang (dts_ma, ttdh_ma, ctttdh_thoidiem, ctttdh_ghichu)
        VALUES ($1, 'TTDH06', NOW(), 'Khách hàng hủy đơn')
      `, [dts_ma]);

      // 3. Hoàn lại số lượng tồn kho và lượt mua
      const itemsRes = await client.query(`SELECT ctsp_ma, ctdh_soluong FROM chitietdonhang WHERE dts_ma = $1`, [dts_ma]);
      for (const item of itemsRes.rows) {
        // Hoàn kho chi tiết
        await client.query(`
          UPDATE chitietsanpham 
          SET ctsp_soluongton = ctsp_soluongton + $1,
              ctsp_luotmua = GREATEST(ctsp_luotmua - $1, 0)
          WHERE ctsp_ma = $2
        `, [item.ctdh_soluong, item.ctsp_ma]);

        // Hoàn kho tổng (bảng sản phẩm)
        await client.query(`
          UPDATE sanpham sp
          SET sp_luotmua = GREATEST(COALESCE(sp_luotmua, 0) - $1, 0)
          FROM chitietsanpham ctsp
          WHERE ctsp.ctsp_ma = $2 AND sp.sp_ma = ctsp.sp_ma
        `, [item.ctdh_soluong, item.ctsp_ma]);
      }

      // 4. Hoàn lại số lượng Voucher nếu có
      const orderRes = await client.query(`SELECT mgg_shop_ma, mgg_vc_ma FROM donhangtheoshop WHERE dts_ma = $1`, [dts_ma]);
      const order = orderRes.rows[0];
      
      if (order.mgg_shop_ma) {
        await client.query(`
          UPDATE magiamgia_shop SET mgg_shop_soluongconlai = mgg_shop_soluongconlai + 1 WHERE mgg_shop_ma = $1
        `, [order.mgg_shop_ma]);
      }
      if (order.mgg_vc_ma) {
        await client.query(`
          UPDATE magiamgia_vanchuyen SET mgg_vc_soluongconlai = mgg_vc_soluongconlai + 1 WHERE mgg_vc_ma = $1
        `, [order.mgg_vc_ma]);
      }

      await client.query('COMMIT');
      return { message: "Hủy đơn hàng thành công!" };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = DonHangModel;