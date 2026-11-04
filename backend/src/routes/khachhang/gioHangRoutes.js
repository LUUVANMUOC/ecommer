// backend/src/routes/khachhang/gioHangRoutes.js
const express = require('express');
const router = express.Router();
const GioHangController = require('../../controllers/khachhang/gioHangController');

router.get('/count/:kh_ma', GioHangController.getCartCount);
router.get('/:kh_ma', GioHangController.getCart);
router.post('/add', GioHangController.addToCart);
router.put('/update', GioHangController.updateQuantity);
router.post('/remove', GioHangController.removeItem);
router.delete('/clear/:kh_ma', GioHangController.clearCart);

module.exports = router;