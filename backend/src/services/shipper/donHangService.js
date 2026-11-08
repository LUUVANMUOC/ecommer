const pool = require('../../config/db');
const ShipperDonHangModel = require('../../models/shipper/donHangModel');
const PhieuKhoModel = require('../../models/quanlykho/phieuKhoModel'); // ⭐ MỚI

const ShipperDonHangService = {
  getChoLay: async (shipper_ma) => {
    return await ShipperDonHangModel.getChoLay(shipper_ma);
  },

  layHang: async (dts_ma, shipper_ma, file, ghichu) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ⭐ MỚI: JOIN shipper để lấy kho_ma
      const checkRes = await client.query(
        `SELECT 
            ttlh.ttlh_thoidiem,
            s.kho_ma,
            (SELECT ttdh_ma FROM chitiettrangthaidonhang 
             WHERE dts_ma = $1 
             ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS current_status
         FROM thongtinlayhang ttlh
         JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma
         WHERE ttlh.dts_ma = $1 AND ttlh.shipper_ma = $2`,
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

      const hinhanhPath = file ? `/uploads/layhang/${file.filename}` : null;
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

      await client.query('COMMIT');
      return { message: 'Lấy hàng thành công! Đã tạo phiếu chờ kho xác nhận nhập.', dts_ma };
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