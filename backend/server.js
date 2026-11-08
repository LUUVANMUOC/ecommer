const express = require('express');
const cors = require('cors');
const path = require('path'); 
require('dotenv').config();
const cron = require('node-cron');
const pool = require('./src/config/db');
const axios = require('axios'); 

// ================= 1. IMPORT ROUTES =================
const thanhToanVanChuyenRoutes = require('./src/routes/san/thanhToanVanChuyenRoutes');
const phiVanChuyenRoutes = require('./src/routes/san/phiVanChuyenRoutes');

// Auth & Sàn
const sanAuthRoutes = require('./src/routes/san/authRoutes');
const gianHangAuthRoutes = require('./src/routes/gianhang/gianHangAuthRoutes'); 
const dvvcAuthRoutes = require('./src/routes/dvvc/authRoutes');
const sanThuongMaiRoutes = require('./src/routes/san/sanThuongMaiRoutes');
const adminDonHangRoutes = require('./src/routes/san/adminDonHangRoutes');

// Danh mục & Hệ thống
const tinhRoutes = require('./src/routes/san/tinhRoutes');
const xaRoutes = require('./src/routes/san/xaRoutes');
const nganHangRoutes = require('./src/routes/san/nganHangRoutes');
const thuongHieuRoutes = require('./src/routes/san/thuongHieuRoutes');
const thuocTinhSanPhamRoutes = require('./src/routes/san/thuocTinhSanPhamRoutes');
const phiChiecKhauRoutes = require('./src/routes/san/phiChiecKhauRoutes');
const nganhHangRoutes = require('./src/routes/san/nganhHangRoutes');
const gianHangKienNghiRoutes = require('./src/routes/san/gianHangKienNghiRoutes');
const loaiShipperRoutes = require('./src/routes/san/loaiShipperRoutes');
const dongTienRoutes = require('./src/routes/san/dongTienRoutes');
// Mã giảm giá
const maGiamGiaSanRoutes = require('./src/routes/san/maGiamGiaSanRoutes');
const maGiamGiaVanChuyenRoutes = require('./src/routes/san/maGiamGiaVanChuyenRoutes');
const maGiamGiaShopRoutes = require('./src/routes/gianhang/maGiamGiaShopRoutes');

// Quản lý kho
const phieuKhoRoutes = require('./src/routes/quanlykho/phieuKhoRoutes');
const quanLyKhoAuthRoutes = require('./src/routes/quanlykho/authRoutes');
const quanLyKhoShipperRoutes = require('./src/routes/quanlykho/shipperRoutes');
const quanLyKhoPhanCongRoutes = require('./src/routes/quanlykho/phanCongRoutes');
const quanLyKhoTrungChuyenRoutes = require('./src/routes/quanlykho/trungChuyenRoutes');
const quanLyKhoPhanCongGiaoHangRoutes = require('./src/routes/quanlykho/phanCongGiaoHangRoutes');
const quanLyKhoLichSuRoutes = require('./src/routes/quanlykho/lichSuRoutes');
const qlkThuTienShipperRoutes = require('./src/routes/quanlykho/thuTienShipperRoutes');
const qlkTatToanRoutes = require('./src/routes/quanlykho/tatToanRoutes');

// Quản lý Gian hàng & Sản phẩm
const adminGianHangRoutes = require('./src/routes/gianhang/adminGianHangRoutes');
const thongTinNhanTienRoutes = require('./src/routes/gianhang/thongTinNhanTienRoutes');
const danhMucSanPhamRoutes = require('./src/routes/gianhang/danhMucSanPhamRoutes');
const sanPhamRoutes = require('./src/routes/gianhang/sanPhamRoutes');
const chiTietSanPhamRoutes = require('./src/routes/gianhang/chiTietSanPhamRoutes');
const trangThaiChiTietSanPhamRoutes = require('./src/routes/san/trangThaiChiTietSanPhamRoutes');
const publicSanPhamRoutes = require('./src/routes/san/publicSanPhamRoutes');
const vanChuyenShopRoutes = require('./src/routes/gianhang/vanChuyenShopRoutes');
const donHangShopRoutes = require('./src/routes/gianhang/donHangShopRoutes');

// Đơn vị vận chuyển (DVVC)
const bangGiaVanChuyenRoutes = require('./src/routes/dvvc/bangGiaVanChuyenRoutes');
const khoRoutes = require('./src/routes/dvvc/khoRoutes');
const dvvcProfileRoutes = require('./src/routes/dvvc/dvvcProfileRoutes');
const phanCongRoutes = require('./src/routes/dvvc/phanCongRoutes');
const shipperRoutes = require('./src/routes/dvvc/shipperRoutes');
const dvvcTheoDoiRoutes = require('./src/routes/dvvc/theoDoiRoutes');

// Shipper
const shipperAuthRoutes = require('./src/routes/shipper/authRoutes');
const shipperDonHangRoutes = require('./src/routes/shipper/donHangRoutes');
const shipperTrungChuyenRoutes = require('./src/routes/shipper/trungChuyenRoutes');
const shipperGiaoHangRoutes = require('./src/routes/shipper/giaoHangRoutes');

// Khách hàng
const thongTinNhanHangRoutes = require('./src/routes/khachhang/thongTinNhanHangRoutes');
const khachHangRoutes = require('./src/routes/khachhang/khachHangRoutes');
const khachHangAuthRoutes = require('./src/routes/khachhang/authRoutes');
const theoDoiShopRoutes = require('./src/routes/khachhang/theoDoiShopRoutes');
const gioHangRoutes = require('./src/routes/khachhang/gioHangRoutes');
const maGiamGiaRoutes = require('./src/routes/khachhang/maGiamGiaRoutes');
const maGiamGiaVanChuyenRoutesKH = require('./src/routes/khachhang/maGiamGiaVanChuyenRoutes');
const maGiamGiaShopRoutesKH = require('./src/routes/khachhang/maGiamGiaShopRoutes');
const datHangRoutes = require('./src/routes/khachhang/datHangRoutes');
const donHangRoutes = require('./src/routes/khachhang/donHangRoutes');

// Khác
const trangThaiDonHangRoutes = require('./src/routes/san/trangThaiDonHangRoutes');
const phiVanChuyenController = require('./src/controllers/khachhang/phiVanChuyenController');

// Bổ sung Import cho Cron & Xử lý
const TatToanModel = require('./src/models/quanlykho/tatToanModel');
const quanLyDongTienRoutes = require('./src/routes/san/quanLyDongTienRoutes');

// ================= 2. KHỞI TẠO APP =================
const app = express(); 

// ================= 3. CẤU HÌNH WEBHOOK (BẮT BUỘC ĐẶT TRƯỚC express.json) =================
// Lưu ý: express.raw() phải được dùng ở đây để lấy raw body cho việc xác thực HMAC

// 🟢 Route Webhook Động dành cho từng Shop (Truyền :gh_ma trên URL)
app.post(
  '/api/webhook/sepay/:gh_ma',
  express.raw({ type: 'application/json' }),
  require('./src/controllers/quanlykho/webhookSepayController').handleShopWebhook
);
app.post(
  '/api/webhook/sepay/dvvc/:dvvc_ma',
  express.raw({ type: 'application/json' }),
  require('./src/controllers/quanlykho/webhookSepayController').handleDvvcWebhook
);

// 🟢 Route Webhook Cũ (Dành cho Sàn, giữ lại để không lỗi)
app.post(
  '/api/webhook/sepay',
  express.raw({ type: 'application/json' }),
  require('./src/controllers/quanlykho/webhookSepayController').handle
);

// ================= 4. MIDDLEWARE TOÀN CỤC =================
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(cors()); 
app.use(express.json()); 

// ================= 5. KHAI BÁO ROUTES =================

// 1. Auth & Người dùng
app.use('/api/auth', sanAuthRoutes); 
app.use('/api/nguoi-ban/auth', gianHangAuthRoutes); 
app.use('/api/dvvc/auth', dvvcAuthRoutes); 
app.use('/api/quan-ly-kho/auth', quanLyKhoAuthRoutes);
app.use('/api/khach-hang/auth', khachHangAuthRoutes);
app.use('/api/san', sanThuongMaiRoutes);

// 2. Danh mục & Hệ thống
app.use('/api/tinh', tinhRoutes);
app.use('/api/xa', xaRoutes);
app.use('/api/ngan-hang', nganHangRoutes); 
app.use('/api/thuong-hieu', thuongHieuRoutes);
app.use('/api/thuoc-tinh-san-pham', thuocTinhSanPhamRoutes);
app.use('/api/phi-chiec-khau', phiChiecKhauRoutes);
app.use('/api/nganh-hang', nganHangRoutes);
app.use('/api/kien-nghi', gianHangKienNghiRoutes);
app.use('/api/loai-shipper', loaiShipperRoutes);
app.use('/api/admin/don-hang', adminDonHangRoutes);

// 3. Mã giảm giá
app.use('/api/ma-giam-gia-san', maGiamGiaSanRoutes);
app.use('/api/ma-giam-gia-van-chuyen', maGiamGiaVanChuyenRoutes);
app.use('/api/nguoi-ban/ma-giam-gia-shop', maGiamGiaShopRoutes);

// 4. Quản lý Gian hàng & Sản phẩm
app.use('/api/admin/gian-hang', adminGianHangRoutes);
app.use('/api/thong-tin-nhan-tien', thongTinNhanTienRoutes);
app.use('/api/nguoi-ban/danh-muc-san-pham', danhMucSanPhamRoutes);
app.use('/api/nguoi-ban/san-pham', sanPhamRoutes);
app.use('/api/nguoi-ban/chi-tiet-san-pham', chiTietSanPhamRoutes);
app.use('/api/trang-thai-chi-tiet', trangThaiChiTietSanPhamRoutes);
app.use('/api/nguoi-ban/van-chuyen', vanChuyenShopRoutes);
app.use('/api/nguoi-ban/don-hang', donHangShopRoutes);
app.use('/api/san-pham', publicSanPhamRoutes);
app.use('/api/admin/thanh-toan-van-chuyen', thanhToanVanChuyenRoutes);

// 🟢 Route Admin quản lý dòng tiền
app.use('/api/admin/dong-tien', quanLyDongTienRoutes);

// 5. Quản lý Kho (QLK)
app.use('/api/quan-ly-kho/shipper', quanLyKhoShipperRoutes);
app.use('/api/quan-ly-kho/phan-cong', quanLyKhoPhanCongRoutes);
app.use('/api/quan-ly-kho/trung-chuyen', quanLyKhoTrungChuyenRoutes);
app.use('/api/quan-ly-kho/phan-cong-giao-hang', quanLyKhoPhanCongGiaoHangRoutes);
app.use('/api/quan-ly-kho/lich-su', quanLyKhoLichSuRoutes);
app.use('/api/quan-ly-kho/thu-tien-shipper', qlkThuTienShipperRoutes); 
app.use('/api/quan-ly-kho/tat-toan', qlkTatToanRoutes);   
app.use('/api/quan-ly-kho/phieu-kho', phieuKhoRoutes);

// 6. Đơn vị vận chuyển (DVVC)
app.use('/api/dvvc/bang-gia', bangGiaVanChuyenRoutes); 
app.use('/api/dvvc/kho', khoRoutes);
app.use('/api/dvvc/thong-tin', dvvcProfileRoutes);
app.use('/api/dvvc/phan-cong', phanCongRoutes);
app.use('/api/dvvc/theo-doi', dvvcTheoDoiRoutes);
app.use('/api/dvvc/shipper', shipperRoutes);

// 7. Shipper
app.use('/api/dvvc/shipper/auth', shipperAuthRoutes);
app.use('/api/dvvc/shipper/don-hang', shipperDonHangRoutes);
app.use('/api/dvvc/shipper/trung-chuyen', shipperTrungChuyenRoutes);
app.use('/api/dvvc/shipper/giao-hang', shipperGiaoHangRoutes);

// 8. Khách hàng
app.use('/api/khach-hang/dia-chi-nhan-hang', thongTinNhanHangRoutes);
app.use('/api/khach-hang/thong-tin', khachHangRoutes);
app.use('/api/khach-hang/theo-doi-shop', theoDoiShopRoutes);
app.use('/api/khach-hang/gio-hang', gioHangRoutes);
app.use('/api/khach-hang/ma-giam-gia', maGiamGiaRoutes);
app.use('/api/khach-hang/ma-giam-gia-van-chuyen', maGiamGiaVanChuyenRoutesKH);
app.use('/api/khach-hang/ma-giam-gia-shop', maGiamGiaShopRoutesKH);
app.use('/api/khach-hang/dat-hang', datHangRoutes);
app.use('/api/khach-hang/don-hang', donHangRoutes);
app.post('/api/khach-hang/tinh-phi-ship', phiVanChuyenController.calculateFee);
app.use('/api/dong-tien', dongTienRoutes);
app.use('/api/phi-van-chuyen', phiVanChuyenRoutes);

// 9. Trạng thái đơn hàng
app.use('/api/trang-thai-don-hang', trangThaiDonHangRoutes);

// ==========================================
// 6. CRONJOB
// ==========================================

// 6.1. Cron tự động dọn dẹp phiếu tất toán quá hạn 2 phút (chạy mỗi phút)
cron.schedule('* * * * *', async () => {
  try {
    await TatToanModel.donDepPhieuQuaHan();
  } catch (error) {
    console.error("❌ [CRONJOB] Lỗi dọn dẹp phiếu tất toán:", error.message);
  }
});

// 6.2. Cron tự động cập nhật trạng thái Voucher (1 phút/lần)
cron.schedule('* * * * *', async () => {
    try {
        const querySan = `
            UPDATE MaGiamGiaSan
            SET MGG_San_TrangThai = CASE 
                WHEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') < MGG_San_ThoiDiemBatDau THEN FALSE
                WHEN MGG_San_ThoiDiemKetThuc IS NOT NULL AND (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') > MGG_San_ThoiDiemKetThuc THEN FALSE
                WHEN MGG_San_SoLuongConLai <= 0 THEN FALSE
                ELSE TRUE
            END
            WHERE MGG_San_TrangThai IS DISTINCT FROM (
                CASE 
                    WHEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') < MGG_San_ThoiDiemBatDau THEN FALSE
                    WHEN MGG_San_ThoiDiemKetThuc IS NOT NULL AND (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') > MGG_San_ThoiDiemKetThuc THEN FALSE
                    WHEN MGG_San_SoLuongConLai <= 0 THEN FALSE
                    ELSE TRUE
                END
            );
        `;
        const resultSan = await pool.query(querySan);
        if (resultSan.rowCount > 0) console.log(`⏰ [CRONJOB] Đã cập nhật trạng thái cho ${resultSan.rowCount} mã giảm giá SÀN.`);

        const queryVC = `
            UPDATE magiamgia_vanchuyen
            SET mgg_vc_trangthai = CASE 
                WHEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') < mgg_vc_thoidiembatdau THEN FALSE
                WHEN mgg_vc_thoidiemketthuc IS NOT NULL AND (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') > mgg_vc_thoidiemketthuc THEN FALSE
                WHEN mgg_vc_soluongconlai <= 0 THEN FALSE
                ELSE TRUE
            END
            WHERE mgg_vc_trangthai IS DISTINCT FROM (
                CASE 
                    WHEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') < mgg_vc_thoidiembatdau THEN FALSE
                    WHEN mgg_vc_thoidiemketthuc IS NOT NULL AND (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') > mgg_vc_thoidiemketthuc THEN FALSE
                    WHEN mgg_vc_soluongconlai <= 0 THEN FALSE
                    ELSE TRUE
                END
            );
        `;
        const resultVC = await pool.query(queryVC);
        if (resultVC.rowCount > 0) console.log(`⏰ [CRONJOB] Đã cập nhật trạng thái cho ${resultVC.rowCount} mã giảm giá VẬN CHUYỂN.`);

        const queryShop = `
            UPDATE magiamgia_shop
            SET mgg_shop_trangthai = CASE 
                WHEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') < mgg_shop_thoidiembatdau THEN FALSE
                WHEN mgg_shop_thoidiemketthuc IS NOT NULL AND (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') > mgg_shop_thoidiemketthuc THEN FALSE
                WHEN mgg_shop_soluongconlai <= 0 THEN FALSE
                ELSE TRUE
            END
            WHERE mgg_shop_trangthai IS DISTINCT FROM (
                CASE 
                    WHEN (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') < mgg_shop_thoidiembatdau THEN FALSE
                    WHEN mgg_shop_thoidiemketthuc IS NOT NULL AND (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') > mgg_shop_thoidiemketthuc THEN FALSE
                    WHEN mgg_shop_soluongconlai <= 0 THEN FALSE
                    ELSE TRUE
                END
            );
        `;
        const resultShop = await pool.query(queryShop);
        if (resultShop.rowCount > 0) console.log(`⏰ [CRONJOB] Đã cập nhật trạng thái cho ${resultShop.rowCount} mã giảm giá SHOP.`);

    } catch (error) {
        console.error("❌ [CRONJOB] Lỗi cập nhật trạng thái mã giảm giá:", error.message);
    }
});

// ================= 7. START SERVER =================
const PORT = process.env.PORT || 8080; 
app.listen(PORT, () => {
    console.log(`🚀 Server Backend đang chạy ở cổng ${PORT}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api/auth`);
    console.log(`⏰ Cronjobs đã được bật (Voucher, Dọn dẹp phiếu).`);
});