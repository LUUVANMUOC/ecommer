const express = require('express');
const router = express.Router();
const SanPhamController = require('../../controllers/gianhang/sanPhamController');

// Đặt trước để không bị nuốt bởi '/:gh_ma'
router.get('/phan-trang/:gh_ma', SanPhamController.getPhanTrang);

router.get('/:gh_ma', SanPhamController.getByGianHang);
router.post('/', SanPhamController.create);
router.put('/:id', SanPhamController.update);
router.delete('/:id', SanPhamController.delete);

module.exports = router;