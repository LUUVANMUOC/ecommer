const pool = require('../../config/db');
const {
  TIMELINE_SQL,
  layNguCanh,
  layNguCanhNhieu,
  loTrinhDayDu,
  ganLoTrinh,
  ganChangHienTai,
} = require('../common/loTrinhVanChuyen');

const TheoDoiModel = {
  getDanhSach: async (dvvc_ma, trangthai, kho_ma, search) => {
    let query = `
      SELECT DISTINCT
        dts.dts_ma AS "DTS_Ma",
        dts.dts_ngaylap AS "NgayLap",
        dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        gh.gh_ten AS "TenShop",
        (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai",
        (SELECT kho_ten FROM kho k JOIN thongtinlayhang ttlh ON k.kho_ma = (SELECT kho_ma FROM shipper WHERE shipper_ma = ttlh.shipper_ma) WHERE ttlh.dts_ma = dts.dts_ma LIMIT 1) AS "Kho_Lay_Hang",
        (SELECT kho_ten FROM kho WHERE kho_ma = (SELECT kho_di_ma FROM thongtintrungchuyen WHERE dts_ma = dts.dts_ma LIMIT 1)) AS "Kho_Di",
        (SELECT kho_ten FROM kho WHERE kho_ma = (SELECT kho_den_ma FROM thongtintrungchuyen WHERE dts_ma = dts.dts_ma LIMIT 1)) AS "Kho_Den"
      FROM donhangtheoshop dts
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      WHERE dts.dts_ma IN (
        SELECT ttlh.dts_ma FROM thongtinlayhang ttlh JOIN shipper s ON ttlh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE k.dvvc_ma = $1
        UNION
        SELECT ttc.dts_ma FROM thongtintrungchuyen ttc JOIN kho k ON ttc.kho_di_ma = k.kho_ma WHERE k.dvvc_ma = $1
        UNION
        SELECT ttgh.dts_ma FROM thongtingiaohang ttgh JOIN shipper s ON ttgh.shipper_ma = s.shipper_ma JOIN kho k ON s.kho_ma = k.kho_ma WHERE k.dvvc_ma = $1
      )
    `;

    const values = [dvvc_ma];
    let index = 2;

    if (search) {
      query += ` AND (dts.dts_ma ILIKE $${index} OR gh.gh_ten ILIKE $${index})`;
      values.push(`%${search}%`);
      index++;
    }

    query = `SELECT * FROM (${query}) AS sub WHERE 1=1`;

    if (trangthai) {
      query += ` AND "TrangThaiHienTai" = $${index}`;
      values.push(trangthai);
      index++;
    }
    if (kho_ma) {
      query += ` AND ("Kho_Lay_Hang" = (SELECT kho_ten FROM kho WHERE kho_ma = $${index}) OR "Kho_Di" = (SELECT kho_ten FROM kho WHERE kho_ma = $${index}) OR "Kho_Den" = (SELECT kho_ten FROM kho WHERE kho_ma = $${index}))`;
      values.push(kho_ma);
      index++;
    }

    query += ` ORDER BY "NgayLap" DESC`;
    const res = await pool.query(query, values);
    const nguCanh = await layNguCanhNhieu(res.rows.map((r) => r.DTS_Ma));
    return ganChangHienTai(res.rows, nguCanh);
  },

  getChiTiet: async (dts_ma) => {
    const infoQuery = `
      SELECT 
        dts.dts_ma AS "DTS_Ma", dts.dts_ngaylap AS "NgayLap", dts.dts_tongtienkhachhangthanhtoan AS "TongTien",
        ttnh.ttnh_ten AS "TenKhach", ttnh.ttnh_sdt AS "SdtKhach", ttnh.ttnh_diachisnapshot AS "DiaChiGiao",
        gh.gh_ten AS "TenShop",
        (SELECT ttdh_ma FROM chitiettrangthaidonhang WHERE dts_ma = dts.dts_ma ORDER BY ctttdh_thoidiem DESC LIMIT 1) AS "TrangThaiHienTai"
      FROM donhangtheoshop dts
      JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
      JOIN donhangkhachmua dm ON dts.dm_ma = dm.dm_ma
      JOIN thongtinnhanhang ttnh ON dm.ttnh_ma = ttnh.ttnh_ma
      WHERE dts.dts_ma = $1
    `;
    const infoRes = await pool.query(infoQuery, [dts_ma]);
    if (infoRes.rows.length === 0) return null;
    const orderInfo = infoRes.rows[0];

    // Timeline 11 mốc + lộ trình đầy đủ (Shop → Kho → Kho → Khách)
    const [timelineRes, nguCanh] = await Promise.all([
      pool.query(TIMELINE_SQL, [dts_ma]),
      layNguCanh(dts_ma),
    ]);

    return {
      ...orderInfo,
      loTrinh: loTrinhDayDu(nguCanh),
      timeline: ganLoTrinh(timelineRes.rows, nguCanh),
    };
  }
};

module.exports = TheoDoiModel;
