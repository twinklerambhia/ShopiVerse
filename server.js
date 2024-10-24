const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const authRoutes = require('./routes/authRoutes');
const productRoutes= require('./routes/productRoutes');
const reviewRoutes= require('./routes/reviewRoutes');
const protectedRoutes= require('./routes/protectedRoutes');

const authenticateToken = require('./middlewares/authenticateToken');



require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products',productRoutes);
app.use('/api/reviews',reviewRoutes);

// Protected routes
app.use('api/products', authenticateToken, productRoutes);
app.use('api/reviews', authenticateToken, reviewRoutes);
app.use('/api', protectedRoutes);

// Sync Database
db.sequelize.sync()
  .then(() => {
    console.log('Database connected and synchronized');
  })
  .catch((err) => {
    console.error('Error connecting to the database: ', err);
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app }; 