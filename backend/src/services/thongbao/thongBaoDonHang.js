// backend/src/services/thongbao/thongBaoDonHang.js
// Thông báo tự động cho luồng đơn hàng:
//   - Khách đặt đơn  -> báo Shop xác nhận ngay
//   - Shop xác nhận  -> báo Kho phụ trách địa chỉ lấy hàng đi lấy hàng
const pool = require('../../config/db');
const ThongBaoService = require('./thongBaoService');

const formatVND = (amount) => Number(amount || 0).toLocaleString('vi-VN') + ' đ';

// Lấy tên khách của đơn tổng (để nội dung thông báo có ngữ cảnh)
const layTenKhach = async (dm_ma) => {
  const res = await pool.query(
    `SELECT kh.kh_ten
     FROM donhangkhachmua dm
     JOIN khachhang kh ON dm.kh_ma = kh.kh_ma
     WHERE dm.dm_ma = $1`,
    [dm_ma],
  );
  return res.rows[0]?.kh_ten || 'Khách hàng';
};

// Sau khi khách đặt hàng: mỗi đơn shop nhận 1 thông báo nhắc xác nhận
const guiShopMoi = async ({ dm_ma, shops = [] }) => {
  if (!shops.length) return [];

  const tenKhach = await layTenKhach(dm_ma);
  const ketQua = [];

  for (const shop of shops) {
    try {
      const r = await ThongBaoService.taoThongBaoVaGui({
        tieu_de: `Đơn hàng ${shop.dts_ma} chờ xác nhận`,
        noi_dung:
          `${tenKhach} vừa đặt đơn ${shop.dts_ma} ` +
          `trị giá ${formatVND(shop.tong_thanh_toan)}. ` +
          'Vui lòng xác nhận đơn ngay để kho chuẩn bị lấy hàng.',
        loai: 'HE_THONG',
        nguon: 'HE_THONG',
        doituong_loai: 'DON_HANG',
        doituong_ma: shop.dts_ma,
        nhom: 'DON_HANG',
        link: '/nguoi-ban/quan-ly-don-hang',
        ds_nguoinhan: [{ loai: 'SHOP', ma: shop.gh_ma }],
      });
      ketQua.push(r);
    } catch (error) {
      console.error(
        `❌ Lỗi gửi thông báo đơn mới cho shop ${shop.gh_ma}:`,
        error.message,
      );
    }
  }

  return ketQua;
};

// Sau khi shop xác nhận: báo kho phụ trách.
// Kho phụ trách = kho có địa chỉ cùng xã với địa chỉ lấy hàng của shop.
// Đây đúng là điều kiện đang dùng ở QuanLyKho/PhanCongModel.getPendingOrders,
// nên đơn hiện trong "Chờ lấy hàng" của kho nào thì kho đó nhận thông báo.
const guiKhoLayHang = async (dts_ma) => {
  const res = await pool.query(
    `SELECT dts.dts_ma,
            dts.dts_tongtienkhachhangthanhtoan AS tong_tien,
            gh.gh_ten,
            dc.dc_mota, xa.xa_ten, tinh.tinh_ten,
            k.kho_ma, k.kho_ten
     FROM donhangtheoshop dts
     JOIN gianhang gh ON dts.gh_ma = gh.gh_ma
     JOIN diachi dc ON dts.dc_layhangma = dc.dc_ma
     JOIN xaphuong xa ON dc.xa_ma = xa.xa_ma
     JOIN tinhtp tinh ON xa.tinh_ma = tinh.tinh_ma
     JOIN kho k ON dc.xa_ma = (SELECT xa_ma FROM diachi WHERE dc_ma = k.dc_ma)
     WHERE dts.dts_ma = $1`,
    [dts_ma],
  );

  // Cùng 1 kho có thể lặp nhiều dòng -> chỉ gửi 1 lần/kho
  const theoKho = new Map();
  for (const row of res.rows) {
    if (!theoKho.has(row.kho_ma)) theoKho.set(row.kho_ma, row);
  }

  const ketQua = [];
  for (const row of theoKho.values()) {
    try {
      const r = await ThongBaoService.taoThongBaoVaGui({
        tieu_de: `Đơn ${dts_ma} cần lấy hàng`,
        noi_dung:
          `Shop "${row.gh_ten}" đã xác nhận đơn ${dts_ma} ` +
          `trị giá ${formatVND(row.tong_tien)}. ` +
          `Đề nghị kho ${row.kho_ten} phân công shipper Lấy hàng (LSP01) tại ` +
          `${row.dc_mota}, ${row.xa_ten}, ${row.tinh_ten}.`,
        loai: 'HE_THONG',
        nguon: 'HE_THONG',
        doituong_loai: 'DON_HANG',
        doituong_ma: dts_ma,
        nhom: 'DON_HANG',
        link: '/quan-ly-kho/phan-cong-shipper',
        ds_nguoinhan: [{ loai: 'KHO', ma: row.kho_ma }],
      });
      ketQua.push(r);
    } catch (error) {
      console.error(
        `❌ Lỗi gửi thông báo lấy hàng cho kho ${row.kho_ma}:`,
        error.message,
      );
    }
  }

  return ketQua;
};

module.exports = { guiShopMoi, guiKhoLayHang };