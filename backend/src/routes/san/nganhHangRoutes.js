const express = require('express');
const router = express.Router();
const NganhHangController = require('../../controllers/san/nganhHangController');

router.get('/', NganhHangController.getAll);
router.post('/', NganhHangController.create);
router.put('/:id', NganhHangController.update);
router.delete('/:id', NganhHangController.delete);

module.exports = router;