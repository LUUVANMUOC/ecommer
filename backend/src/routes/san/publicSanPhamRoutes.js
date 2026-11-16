const express = require('express');
const router = express.Router();
const PublicSanPhamController = require('../../controllers/san/publicSanPhamController');
const PublicGianHangController = require('../../controllers/san/publicGianHangController');
const PublicNoiBatController = require('../../controllers/san/publicNoiBatController');

// ==========================================================
// CÁC ROUTE CỤ THỂ (PHẢI ĐẶT TRƯỚC ROUTE CÓ THAM SỐ /:sp_ma)
// ==========================================================

// 0. Khối nổi bật cho trang /san-pham
router.get('/noi-bat', PublicNoiBatController.getNoiBat);

// 1. Route Lịch sử xem và Ghi nhận view
router.post('/record-view', PublicSanPhamController.recordView);
router.get('/lich-su-xem/:kh_ma', PublicSanPhamController.getViewHistory);

// 2. Route lấy sản phẩm theo Shop
router.get('/shop/:gh_ma', PublicSanPhamController.getByShop);

// 3. Route lấy thông tin Shop
router.get('/gian-hang/:gh_ma', PublicGianHangController.getShopProfile);

// 4. Route Like sản phẩm
router.put('/:id/like', PublicSanPhamController.toggleLike);

// 🟢 Route lấy Voucher của Shop
router.get('/gian-hang/:gh_ma/vouchers', PublicGianHangController.getShopVouchers);

// 5. Route lấy đánh giá của sản phẩm (public)
//    ?page=1&limit=5&sao=5&ctsp_ma=...
router.get('/:sp_ma/danh-gia', PublicSanPhamController.getDanhGia);

// ==========================================================
// CÁC ROUTE CHUNG (ĐẶT Ở DƯỚI CÙNG)
// ==========================================================
router.get('/', PublicSanPhamController.getAll);
router.get('/:sp_ma', PublicSanPhamController.getDetail);

module.exports = router;