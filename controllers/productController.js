const { Product, Review } = require('../models');

const productController = {
  addProduct: async (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
      return res.status(403).json({ message: 'User not logged in. Please log in to add products.' });
    }
    const { name, description, price, quantity, inStock } = req.body;
    try {
      const product = await Product.create({ name, description, price, quantity, inStock });
      res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
      res.status(500).json({ message: 'Error adding product', error });
    }
  },

  listProducts: async (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
      return res.status(403).json({ message: 'User not logged in. Please log in to view products.' });
    }
    try {
      const products = await Product.findAll({ include: [{ model: Review, as: 'Reviews' } ]});
      res.status(200).json(products);
    } catch (error) {
      console.error('error fetching products:',error);
      res.status(500).json({ message: 'Error fetching products', error });
    }
  }
};

module.exports = productController;
