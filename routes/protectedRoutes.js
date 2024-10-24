const express = require('express');
const authenticateToken = require('../middlewares/authenticateToken'); // Adjust path as necessary
const router = express.Router();

// Protected route
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You have accessed a protected route!', user: req.user });
});

// Export the router
module.exports = router;
