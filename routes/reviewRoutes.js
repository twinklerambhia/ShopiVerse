const express = require('express');
const reviewController = require('../controllers/reviewController');

const authenticateToken = require('../middlewares/authenticateToken');
const router = express.Router();

router.post('/add',authenticateToken,reviewController.addReview);

module.exports = router;
