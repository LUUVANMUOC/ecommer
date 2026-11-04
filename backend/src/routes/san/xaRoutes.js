const express = require('express');
const router = express.Router();
const XaController = require('../../controllers/san/xaController');

router.get('/', XaController.getAll);
router.post('/', XaController.create);
router.put('/:id', XaController.update);
router.delete('/:id', XaController.delete);

module.exports = router;