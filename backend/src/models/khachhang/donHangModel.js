const pool = require('../../config/db');

const DonHangModel = {
  getOrdersByCustomer: async (kh_ma) => {
    const orderQuery = `
      SELECT dm_ma AS "DM_Ma", dm_ngaylap AS "NgayLap", dm_tongtien AS "TongTien", ttnh_diachisnapshot AS "DiaChiNhan"
      FROM donhangkhachmua dm JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE dm.kh_ma = $1 ORDER BY dm.dm_ngaylap DESC
    `;
    const ordersRes = await pool.query(orderQuery, [kh_ma]);
    const orders = ordersRes.rows;

    for (let order of orders) {
      const shopQuery = `
        SELECT 
          dts.dts_ma AS "DTS_Ma", dts.dts_tongtienhang AS "TongTienHang", dts.dts_tienvanchuyen AS "TienVanChuyen", dts.dts_tongtienkhachhangthanhtoan AS "TongThanhToan", gh.gh_ten AS "TenShop", gh.gh_hinhanh AS "HinhShop",
          (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai",
          -- 🟢 Lấy thông tin Shipper giao đơn (LSP03)
          ttgh.shipper_ma AS "Shipper_Ma",
          s.shipper_ten AS "Shipper_Ten",
          s.shipper_hinhanh AS "Shipper_HinhAnh",
          -- 🟢 Lấy đánh giá Shipper (nếu có)
          dgs.dgshp_sao AS "Shipper_Sao",
          dgs.dgshp_mota AS "Shipper_MoTa"
        FROM donhangtheoshop dts 
        JOIN gianhang gh ON dts.gh_ma = gh.gh_ma 
        LEFT JOIN thongtingiaohang ttgh ON dts.dts_ma = ttgh.dts_ma
        LEFT JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma
        LEFT JOIN danhgiashipper dgs ON dts.dts_ma = dgs.dts_ma AND dgs.kh_ma = $2
        WHERE dts.dm_ma = $1
      `;
      const shopRes = await pool.query(shopQuery, [order.DM_Ma, kh_ma]);
      
      for (let shop of shopRes.rows) {
        const itemQuery = `
          SELECT ctsp.ctsp_ma AS "Ctsp_Ma", sp.sp_ten AS "TenSanPham", ctsp.ctsp_ten AS "TenPhanLoai", ctsp.ctsp_gianban AS "GiaBan", ctdh.ctdh_soluong AS "SoLuong",
            (SELECT hasp_link FROM hinhanhsanpham WHERE ctsp_ma = ctsp.ctsp_ma ORDER BY hasp_laanhchinh DESC LIMIT 1) AS "Image",
            (SELECT row_to_json(dg) FROM danhgiasanpham dg WHERE dg.dts_ma = $1 AND dg.ctsp_ma = ctsp.ctsp_ma AND dg.kh_ma = $2) AS "DanhGia"
          FROM chitietdonhang ctdh JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
          WHERE ctdh.dts_ma = $1
        `;
        const itemRes = await pool.query(itemQuery, [shop.DTS_Ma, kh_ma]);
        shop.items = itemRes.rows;
      }
      order.shops = shopRes.rows;
    }
    return orders;
  },

  getLatestStatus: async (client, dts_ma) => {
    const res = await client.query(`SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = $1 ORDER BY ctttdh_thoidiem DESC LIMIT 1`, [dts_ma]);
    return res.rows[0]?.ttdh_ma;
  },

  cancelOrder: async (dts_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const currentStatus = await DonHangModel.getLatestStatus(client, dts_ma);
      if (currentStatus !== 'TTDH01') throw new Error("Chỉ có thể hủy đơn hàng đang ở trạng thái 'Chờ Xác Nhận'.");
      await client.query(`INSERT INTO chitiettrangthaidonhang (dts_ma, ttdh_ma, ctttdh_thoidiem, ctttdh_ghichu) VALUES ($1, 'TTDH06', NOW(), 'Khách hàng hủy đơn')`, [dts_ma]);
      const itemsRes = await client.query(`SELECT ctsp_ma, ctdh_soluong FROM chitietdonhang WHERE dts_ma = $1`, [dts_ma]);
      for (const item of itemsRes.rows) {
        await client.query(`UPDATE chitietsanpham SET ctsp_soluongton = ctsp_soluongton + $1, ctsp_luotmua = GREATEST(ctsp_luotmua - $1, 0) WHERE ctsp_ma = $2`, [item.ctdh_soluong, item.ctsp_ma]);
        await client.query(`UPDATE sanpham sp SET sp_luotmua = GREATEST(COALESCE(sp_luotmua, 0) - $1, 0) FROM chitietsanpham ctsp WHERE ctsp.ctsp_ma = $2 AND sp.sp_ma = ctsp.sp_ma`, [item.ctdh_soluong, item.ctsp_ma]);
      }
      const orderRes = await client.query(`SELECT mgg_shop_ma, mgg_vc_ma FROM donhangtheoshop WHERE dts_ma = $1`, [dts_ma]);
      const order = orderRes.rows[0];
      if (order.mgg_shop_ma) await client.query(`UPDATE magiamgia_shop SET mgg_shop_soluongconlai = mgg_shop_soluongconlai + 1 WHERE mgg_shop_ma = $1`, [order.mgg_shop_ma]);
      if (order.mgg_vc_ma) await client.query(`UPDATE magiamgia_vanchuyen SET mgg_vc_soluongconlai = mgg_vc_soluongconlai + 1 WHERE mgg_vc_ma = $1`, [order.mgg_vc_ma]);
      await client.query('COMMIT');
      return { message: "Hủy đơn hàng thành công!" };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },

  // ⭐ MỚI: Khách xác nhận đã nhận hàng
    // ⭐ Khách xác nhận đã nhận hàng (Cập nhật lượt mua)
  xacNhanDaNhanHang: async (dts_ma) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const currentStatus = await DonHangModel.getLatestStatus(client, dts_ma);
      if (currentStatus !== 'TTDH04') throw new Error("Đơn hàng chưa được giao hoặc đã hoàn thành!");
      
      await client.query(`INSERT INTO chitiettrangthaidonhang (dts_ma, ttdh_ma, ctttdh_thoidiem, ctttdh_ghichu) VALUES ($1, 'TTDH05', NOW(), 'Khách hàng đã nhận được hàng')`, [dts_ma]);
      await client.query(`UPDATE donhangtheoshop SET dts_trangthaithanhtoan = true WHERE dts_ma = $1`, [dts_ma]);
      
      // 🟢 TÍNH LƯỢT MUA
      const itemsRes = await client.query(`SELECT ctsp_ma, ctdh_soluong FROM chitietdonhang WHERE dts_ma = $1`, [dts_ma]);
      for (const item of itemsRes.rows) {
        // 1. Cộng lượt mua cho Chi tiết sản phẩm
        await client.query(`
          UPDATE chitietsanpham 
          SET ctsp_luotmua = ctsp_luotmua + $1 
          WHERE ctsp_ma = $2
        `, [item.ctdh_soluong, item.ctsp_ma]);

        // 2. Cộng lượt mua cho Sản phẩm tổng
        await client.query(`
          UPDATE sanpham sp
          SET sp_luotmua = sp_luotmua + $1
          FROM chitietsanpham ctsp
          WHERE ctsp.ctsp_ma = $2 AND sp.sp_ma = ctsp.sp_ma
        `, [item.ctdh_soluong, item.ctsp_ma]);
      }
      
      await client.query('COMMIT');
      return { message: "Xác nhận nhận hàng thành công!" };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },

  // ⭐ MỚI: Khách gửi/sửa đánh giá
    // ⭐ Cập nhật hàm gửi đánh giá (Tính toán lại điểm trung bình)
    // ⭐ Hàm gửi đánh giá (Đã cập nhật tính điểm cho cả CTSP, SP và Gian hàng)
    guiDanhGia: async (dts_ma, kh_ma, ctsp_ma, sao, mota, hinhanh, shipperData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lưu đánh giá sản phẩm
      const query = `
        INSERT INTO danhgiasanpham (kh_ma, ctsp_ma, dts_ma, dgsp_sao, dgsp_mota, dgsp_hinhanh, dgsp_thoidiem)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (kh_ma, ctsp_ma, dts_ma) 
        DO UPDATE SET dgsp_sao = EXCLUDED.dgsp_sao, dgsp_mota = EXCLUDED.dgsp_mota, dgsp_hinhanh = COALESCE(EXCLUDED.dgsp_hinhanh, danhgiasanpham.dgsp_hinhanh), dgsp_thoidiem = NOW()
      `;
      await client.query(query, [kh_ma, ctsp_ma, dts_ma, sao, mota, hinhanh]);

      // 2. Tính điểm trung bình Sản phẩm, Gian hàng (Giữ nguyên)
      await client.query(`
        UPDATE chitietsanpham SET ctsp_diemdanhgiatrungbinh = (SELECT COALESCE(AVG(dgsp_sao), 0)::numeric(3,2) FROM danhgiasanpham WHERE ctsp_ma = $1) WHERE ctsp_ma = $1
      `, [ctsp_ma]);
      await client.query(`
        UPDATE sanpham sp SET sp_diemdanhgiatrungbinh = (SELECT COALESCE(AVG(dg.dgsp_sao), 0)::numeric(3,2) FROM danhgiasanpham dg JOIN chitietsanpham ctsp ON dg.ctsp_ma = ctsp.ctsp_ma WHERE ctsp.sp_ma = sp.sp_ma) FROM chitietsanpham ctsp_target WHERE sp.sp_ma = ctsp_target.sp_ma AND ctsp_target.ctsp_ma = $1
      `, [ctsp_ma]);

      // 3. 🟢 LƯU ĐÁNH GIÁ SHIPPER VÀ TÍNH ĐIỂM TRUNG BÌNH
      if (shipperData && shipperData.shipper_ma) {
        // Lưu vào bảng danhgiashipper
        await client.query(`
          INSERT INTO danhgiashipper (kh_ma, dts_ma, shipper_ma, dgshp_sao, dgshp_mota, dgshp_thoidiem)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (kh_ma, dts_ma) 
          DO UPDATE SET dgshp_sao = EXCLUDED.dgshp_sao, dgshp_mota = EXCLUDED.dgshp_mota, dgshp_thoidiem = NOW()
        `, [kh_ma, dts_ma, shipperData.shipper_ma, shipperData.shipper_sao, shipperData.shipper_mota]);

        // Cập nhật lại điểm trung bình cho Shipper
        await client.query(`
          UPDATE shipper 
          SET shipper_diemdanhgiatrungbinh = (
            SELECT COALESCE(AVG(dgshp_sao), 0)::numeric(3,2)
            FROM danhgiashipper 
            WHERE shipper_ma = $1
          )
          WHERE shipper_ma = $1
        `, [shipperData.shipper_ma]);
      }

      await client.query('COMMIT');
      return { message: "Gửi đánh giá thành công!" };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};
module.exports = DonHangModel;