const pool = require('../../config/db');
const ShipperDonHangModel = require('../../models/shipper/donHangModel');
const PhieuKhoModel = require('../../models/quanlykho/phieuKhoModel'); // ⭐ MỚI

const MAX_BATCH = 100;

// Bỏ mã rỗng + bỏ trùng, giữ nguyên thứ tự gửi lên
const normalizeDanhSach = (danh_sach) => {
  if (!Array.isArray(danh_sach)) return [];
  return [...new Set(danh_sach.map((ma) => String(ma || '').trim()).filter(Boolean))];
};

const layHinhanhPath = (file) => (file ? `/uploads/layhang/${file.filename}` : null);

// Lõi nghiệp vụ lấy hàng: CHỈ chạy bên trong transaction do caller mở.
// Dùng chung cho lấy 1 đơn và lấy hàng loạt -> không có 2 bản logic.
const thucHienLayHang = async (client, dts_ma, shipper_ma, hinhanhPath, ghichu) => {
  // FOR UPDATE OF ttlh: khoá đúng dòng phân công, tránh 2 lần bấm cùng lấy 1 đơn
  const checkRes = await client.query(
    `SELECT 
        ttlh.ttlh_thoidiem,
        s.kho_ma,
        (SELECT ttdh_ma FROM chitiettrangthaidonhang 
         WHERE dts_ma = $1 
         ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS current_status
     FROM thongtinlayhang ttlh
     JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma
     WHERE ttlh.dts_ma = $1 AND ttlh.shipper_ma = $2
     FOR UPDATE OF ttlh`,
    [dts_ma, shipper_ma]
  );

  if (checkRes.rows.length === 0) {
    throw new Error('Bạn không được phân công đơn hàng này!');
  }

  const record = checkRes.rows[0];
  if (record.ttlh_thoidiem) {
    throw new Error('Đơn hàng này đã được lấy rồi!');
  }
  if (record.current_status !== 'TTDH02') {
    throw new Error(
      `Đơn hàng không ở trạng thái "Chờ lấy hàng" (hiện tại: ${record.current_status})!`
    );
  }

  if (!hinhanhPath) {
    throw new Error('Bắt buộc phải có ảnh minh chứng lấy hàng!');
  }

  await client.query(
    `UPDATE thongtinlayhang 
     SET ttlh_thoidiem = NOW(), 
         ttlh_hinhanh = $1, 
         ttlh_ghichu = $2
     WHERE dts_ma = $3 AND shipper_ma = $4`,
    [hinhanhPath, ghichu || null, dts_ma, shipper_ma]
  );

  await client.query(
    `INSERT INTO chitiettrangthaidonhang (dts_ma, ttdh_ma, ctttdh_thoidiem, ctttdh_ghichu)
     VALUES ($1, 'TTDH03', NOW(), $2)`,
    [dts_ma, 'Shipper đã lấy hàng']
  );

  // ⭐ MỚI: Tạo phiếu NHAP/TU_LSP01 ở trạng thái CHO_XAC_NHAN
  await PhieuKhoModel.taoPhieu(client, {
    kho_ma: record.kho_ma,
    dts_ma,
    pk_loai: 'NHAP',
    pk_ly_do: 'TU_LSP01',
    shipper_ma,
    pk_trangthai: 'CHO_XAC_NHAN',
    pk_hinhanh: hinhanhPath, // Dùng luôn ảnh lấy hàng làm tham chiếu
  });

  return { message: 'Lấy hàng thành công! Đã tạo phiếu chờ kho xác nhận nhập.', dts_ma };
};

const ShipperDonHangService = {
  getChoLay: async (shipper_ma) => {
    return await ShipperDonHangModel.getChoLay(shipper_ma);
  },

  // Lấy 1 đơn: giữ nguyên hành vi cũ (1 transaction riêng)
  layHang: async (dts_ma, shipper_ma, file, ghichu) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await thucHienLayHang(
        client,
        dts_ma,
        shipper_ma,
        layHinhanhPath(file),
        ghichu
      );
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Lấy hàng loạt theo shop: TẤT CẢ HOẶC KHÔNG GÌ CẢ.
  // Cả lô chạy trong 1 transaction -> 1 đơn lỗi thì rollback sạch, không đơn nào bị ghi.
  layHangHangLoat: async (shipper_ma, danh_sach, file, ghichu) => {
    if (!shipper_ma) throw new Error('Thiếu mã shipper!');

    const hinhanhPath = layHinhanhPath(file);
    if (!hinhanhPath) throw new Error('Bắt buộc phải có ảnh minh chứng lấy hàng!');

    const ds = normalizeDanhSach(danh_sach);
    if (ds.length === 0) throw new Error('Vui lòng chọn ít nhất 1 đơn hàng!');
    if (ds.length > MAX_BATCH) throw new Error(`Chỉ lấy tối đa ${MAX_BATCH} đơn mỗi lần!`);

    const ghiChuChung =
      (ghichu && String(ghichu).trim()) || `Lấy hàng loạt ${ds.length} đơn`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const dts_ma of ds) {
        try {
          await thucHienLayHang(client, dts_ma, shipper_ma, hinhanhPath, ghiChuChung);
        } catch (error) {
          // Gắn mã đơn vào lỗi để shipper biết đơn nào làm hỏng cả lô
          throw new Error(`Đơn ${dts_ma}: ${error.message}`);
        }
      }

      await client.query('COMMIT');
      return {
        tongSo: ds.length,
        thanhCong: ds.length,
        boQua: 0,
        ketQua: ds.map((dts_ma) => ({ dts_ma, ok: true })),
        message: `Đã lấy hàng ${ds.length} đơn và tạo ${ds.length} phiếu chờ kho xác nhận.`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getLichSu: async (shipper_ma) => {
    return await ShipperDonHangModel.getLichSu(shipper_ma);
  },
};

module.exports = ShipperDonHangService;
