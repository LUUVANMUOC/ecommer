const express = require('express');
const router = express.Router();
const PublicSanPhamController = require('../../controllers/san/publicSanPhamController');

router.get('/', PublicSanPhamController.getAll);
router.get('/:sp_ma', PublicSanPhamController.getDetail);

// Thêm route Like dành cho Khách hàng
router.put('/:id/like', PublicSanPhamController.toggleLike);

module.exports = router;