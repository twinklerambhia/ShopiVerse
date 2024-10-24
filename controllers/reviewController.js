const { Review, Product } = require('../models');

const reviewController = {
  addReview: async (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
      return res.status(403).json({ message: 'User not logged in. Please log in to add reviews.' });
    }
    const { productId, rating, comment } = req.body;
    try {
      const product = await Product.findByPk(productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const review = await Review.create({ productId, rating, comment });
      res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
      console.error('Error adding review:', error);
      res.status(500).json({ message: 'Error adding review', error });
    }
  }
};

module.exports = reviewController;
