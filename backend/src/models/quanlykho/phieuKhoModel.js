const pool = require('../../config/db');

const PhieuKhoModel = {
  taoPhieu: async (clientOrData, maybeData) => {
    const client = maybeData ? clientOrData : await pool.connect();
    const data = maybeData || clientOrData;
    const shouldRelease = !maybeData;

    try {
      const seqName = data.pk_loai === 'NHAP' ? 'phieu_kho_nhap_seq' : 'phieu_kho_xuat_seq';
      const prefix = data.pk_loai === 'NHAP' ? 'PKN' : 'PKX';

      const seqRes = await client.query(`SELECT nextval('${seqName}') AS seq`);
      const pk_ma = prefix + String(seqRes.rows[0].seq).padStart(7, '0');

      const query = `
        INSERT INTO phieu_kho (
          pk_ma, kho_ma, dts_ma, pk_loai, pk_ly_do, shipper_ma,
          pk_trangthai, pk_hinhanh, pk_ghichu,
          pk_thoigian_tao, pk_thoigian_xacnhan
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          NOW(),
          CASE WHEN $7::VARCHAR = 'DA_XAC_NHAN' THEN NOW() ELSE NULL END
        )
        RETURNING *
      `;

      const values = [
        pk_ma, data.kho_ma, data.dts_ma, data.pk_loai, data.pk_ly_do,
        data.shipper_ma || null, data.pk_trangthai || 'CHO_XAC_NHAN',
        data.pk_hinhanh || null, data.pk_ghichu || null,
      ];

      const res = await client.query(query, values);
      return res.rows[0];
    } finally {
      if (shouldRelease) client.release();
    }
  },

  getChoXacNhan: async (kho_ma, loai) => {
    const query = `
      SELECT 
        pk.pk_ma AS "PK_Ma", pk.dts_ma AS "DTS_Ma", pk.pk_loai AS "Loai",
        pk.pk_ly_do AS "LyDo", pk.pk_thoigian_tao AS "ThoiGianTao",
        s.shipper_ma AS "Shipper_Ma", s.shipper_ten AS "Shipper_Ten", s.shipper_sdt AS "Shipper_SDT", s.shipper_hinhanh AS "Shipper_HinhAnh",
        gh.gh_ten AS "TenShop", dc_shop.dc_mota AS "DiaChiLayHang",
        ttnh.ttnh_diachisnapshot AS "DiaChiGiao", ttnh.ttnh_ten AS "TenKhach", ttnh.ttnh_sdt AS "SdtKhach",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien"
      FROM phieu_kho pk
      JOIN donhangtheoshop dts ON pk.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN diachi dc_shop ON dts.dc_layhangma = dc_shop.dc_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma
      WHERE pk.kho_ma = $1 AND pk.pk_loai = $2 AND pk.pk_trangthai = 'CHO_XAC_NHAN'
      ORDER BY pk.pk_thoigian_tao ASC
    `;
    const res = await pool.query(query, [kho_ma, loai]);

    for (const pk of res.rows) {
      const itemsRes = await pool.query(
        `SELECT sp.sp_ten AS "TenSanPham", ctsp.ctsp_ten AS "TenPhanLoai", ctdh.ctdh_soluong AS "SoLuong"
         FROM chitietdonhang ctdh
         JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma
         JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma
         WHERE ctdh.dts_ma = $1`,
        [pk.DTS_Ma]
      );
      pk.items = itemsRes.rows;
    }
    return res.rows;
  },

  xacNhanNhap: async (pk_ma, kho_ma, hinhanh, ghichu) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const check = await client.query(
        `SELECT pk_trangthai, pk_ly_do, dts_ma FROM phieu_kho WHERE pk_ma = $1 AND kho_ma = $2 FOR UPDATE`,
        [pk_ma, kho_ma]
      );
      if (check.rows.length === 0) throw new Error('Không tìm thấy phiếu!');
      if (check.rows[0].pk_trangthai !== 'CHO_XAC_NHAN') throw new Error('Phiếu đã được xử lý!');
      
      const phieu = check.rows[0];

      const res = await client.query(
        `UPDATE phieu_kho SET pk_trangthai = 'DA_XAC_NHAN', pk_hinhanh = $3, pk_ghichu = COALESCE($4, pk_ghichu), pk_thoigian_xacnhan = NOW()
         WHERE pk_ma = $1 AND kho_ma = $2 RETURNING *`,
        [pk_ma, kho_ma, hinhanh, ghichu || null]
      );

      if (phieu.pk_ly_do === 'TRUNG_CHUYEN_DEN') {
        await client.query(
          `UPDATE thongtintrungchuyen SET ttc_thoidiemden = NOW() WHERE dts_ma = $1 AND kho_den_ma = $2 AND ttc_thoidiemden IS NULL`,
          [phieu.dts_ma, kho_ma]
        );
      }

      await client.query('COMMIT');
      return { message: 'Xác nhận nhập kho thành công!', data: res.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  xacNhanXuat: async (pk_ma, kho_ma, hinhanh, ghichu) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const check = await client.query(
        `SELECT pk_trangthai, pk_ly_do, dts_ma FROM phieu_kho WHERE pk_ma = $1 AND kho_ma = $2 FOR UPDATE`,
        [pk_ma, kho_ma]
      );
      if (check.rows.length === 0) throw new Error('Không tìm thấy phiếu!');
      if (check.rows[0].pk_trangthai !== 'CHO_XAC_NHAN') throw new Error('Phiếu đã được xử lý!');
      
      const phieu = check.rows[0];

      const res = await client.query(
        `UPDATE phieu_kho SET pk_trangthai = 'DA_XAC_NHAN', pk_hinhanh = $3, pk_ghichu = COALESCE($4, pk_ghichu), pk_thoigian_xacnhan = NOW()
         WHERE pk_ma = $1 AND kho_ma = $2 RETURNING *`,
        [pk_ma, kho_ma, hinhanh, ghichu || null]
      );

      if (phieu.pk_ly_do === 'GIAO_LSP03') {
        await client.query(
          `INSERT INTO chitiettrangthaidonhang (dts_ma, ttdh_ma, ctttdh_thoidiem, ctttdh_ghichu) VALUES ($1, 'TTDH04', NOW(), 'Thủ kho đã xuất hàng, giao cho LSP03')`,
          [phieu.dts_ma]
        );
      }

      await client.query('COMMIT');
      return { message: 'Xác nhận xuất kho thành công!', data: res.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getLichSu: async (kho_ma, loai, lyDo) => {
    const query = `
      SELECT pk.pk_ma AS "PK_Ma", pk.dts_ma AS "DTS_Ma", pk.pk_loai AS "Loai", pk.pk_ly_do AS "LyDo", pk.pk_trangthai AS "TrangThai", pk.pk_thoigian_tao AS "ThoiGianTao", pk.pk_thoigian_xacnhan AS "ThoiGianXacNhan", pk.pk_hinhanh AS "HinhAnh", pk.pk_ghichu AS "GhiChu",
        s.shipper_ma AS "Shipper_Ma", s.shipper_ten AS "Shipper_Ten", s.shipper_sdt AS "Shipper_SDT", gh.gh_ten AS "TenShop", ttnh.ttnh_ten AS "TenKhach"
      FROM phieu_kho pk
      JOIN donhangtheoshop dts ON pk.dts_ma = dts.dts_ma
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma
      WHERE pk.kho_ma = $1 AND ($2::text IS NULL OR pk.pk_loai = $2) AND ($3::text IS NULL OR pk.pk_ly_do = $3)
      ORDER BY pk.pk_thoigian_tao DESC LIMIT 500
    `;
    const res = await pool.query(query, [kho_ma, loai || null, lyDo || null]);
    return res.rows;
  },

  getChiTiet: async (pk_ma) => {
    const pkRes = await pool.query(`
        SELECT pk.pk_ma AS "PK_Ma", pk.dts_ma AS "DTS_Ma", pk.pk_loai AS "Loai", pk.pk_ly_do AS "LyDo", pk.pk_trangthai AS "TrangThai", pk.pk_hinhanh AS "HinhAnh", pk.pk_ghichu AS "GhiChu", pk.pk_thoigian_tao AS "ThoiGianTao", pk.pk_thoigian_xacnhan AS "ThoiGianXacNhan",
          k.kho_ma AS "Kho_Ma", k.kho_ten AS "Kho_Ten", k.kho_hinhanh AS "Kho_HinhAnh", kc.dc_mota AS "Kho_DiaChi", kt.tinh_ten AS "Kho_Tinh", kx.xa_ten AS "Kho_Xa", d.dvvc_ma AS "DVVC_Ma", d.dvvc_ten AS "DVVC_Ten",
          s.shipper_ma AS "Shipper_Ma", s.shipper_ten AS "Shipper_Ten", s.shipper_sdt AS "Shipper_SDT", gh.gh_ten AS "TenShop", dcs.dc_mota AS "DiaChiShop", ttnh.ttnh_ten AS "TenKhach", ttnh.ttnh_sdt AS "SdtKhach", ttnh.ttnh_diachisnapshot AS "DiaChiGiao", dts.dts_tongtienkhachhangthanhtoan AS "TongTien"
        FROM phieu_kho pk
        JOIN kho k ON pk.kho_ma = k.kho_ma JOIN diachi kc ON k.dc_ma = kc.dc_ma JOIN xaphuong kx ON kc.xa_ma = kx.xa_ma JOIN tinhtp kt ON kx.tinh_ma = kt.tinh_ma JOIN donvivanchuyen d ON k.dvvc_ma = d.dvvc_ma
        JOIN donhangtheoshop dts ON pk.dts_ma = dts.dts_ma JOIN gianhang gh ON dts.gh_ma = gh.gh_ma JOIN diachi dcs ON dts.dc_layhangma = dcs.dc_ma JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
        LEFT JOIN shipper s ON pk.shipper_ma = s.shipper_ma
        WHERE pk.pk_ma = $1 LIMIT 1
      `, [pk_ma]);

    if (pkRes.rows.length === 0) return null;
    const phieu = pkRes.rows[0];

    const itemsRes = await pool.query(`
        SELECT sp.sp_ten AS "TenSanPham", ctsp.ctsp_ten AS "TenPhanLoai", ctdh.ctdh_soluong AS "SoLuong", ctdh.ctdh_dongia AS "DonGia", ctdh.ctdh_thanhtien AS "ThanhTien"
        FROM chitietdonhang ctdh JOIN chitietsanpham ctsp ON ctdh.ctsp_ma = ctsp.ctsp_ma JOIN sanpham sp ON ctsp.sp_ma = sp.sp_ma WHERE ctdh.dts_ma = $1
      `, [phieu.DTS_Ma]);

    phieu.items = itemsRes.rows;
    return phieu;
  },
};
module.exports = PhieuKhoModel;