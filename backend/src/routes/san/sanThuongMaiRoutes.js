// backend/src/routes/san/sanThuongMaiRoutes.js
const express = require('express');
const router = express.Router();
const SanThuongMaiController = require('../../controllers/san/sanThuongMaiController');

router.get('/profile/:id', SanThuongMaiController.getProfile);
router.put('/profile/:id', SanThuongMaiController.updateProfile);
router.put('/change-password', SanThuongMaiController.changePassword);
router.post('/bank/:id', SanThuongMaiController.saveBankAccount);
router.delete('/bank/:id', SanThuongMaiController.deleteBankAccount);

module.exports = router;