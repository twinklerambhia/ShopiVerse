const express = require('express');
const authController = require('../controllers/authController');

const authenticateToken=require('../middlewares/authenticateToken'); 
const refreshMiddleware = require('../middlewares/refreshMiddleware');

const router = express.Router();

router.post('/signup',  authController.signUp);
router.post('/signin', authController.signIn);
router.post('/logout',authenticateToken, authController.logout);
router.post('/refresh-token', refreshMiddleware,authController.refreshToken); // New route for refreshing tokens
router.post('/forgot-password',authController.forgotPassword);
router.post('/reset-password',authController.resetPassword);
router.post('/resend-link', authController.resendLink);

module.exports = router;
