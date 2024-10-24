const express = require('express');
const productController = require('../controllers/productController');

const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

router.post('/add', authenticateToken,productController.addProduct);
router.get('/list',authenticateToken, productController.listProducts);

module.exports = router;
