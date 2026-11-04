const express = require('express');
const router = express.Router();
const ThongTinNhanTienController = require('../../controllers/gianhang/thongTinNhanTienController');

// Route lấy thông tin
router.get('/:gh_ma', ThongTinNhanTienController.getByGianHang);

// Route thêm/cập nhật (Upsert)
router.post('/', ThongTinNhanTienController.save);

// Route xóa (Chỉ cần truyền mã GH)
router.delete('/:gh_ma', ThongTinNhanTienController.delete);

module.exports = router;