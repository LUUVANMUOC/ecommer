const express = require('express');
const router = express.Router();
const TinhController = require('../../controllers/san/tinhController');

router.get('/', TinhController.getAll);
router.post('/', TinhController.create);
router.put('/:id', TinhController.update);
router.delete('/:id', TinhController.delete);

module.exports = router;