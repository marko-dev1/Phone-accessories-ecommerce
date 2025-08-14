const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const adminAuth = require('../middlewares/adminAuth');
const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });



// Get all products
router.get('/', async (req, res) => {
    // console.log('Fetching products...');
    try {
        const [products] = await db.query('SELECT * FROM products');
        // console.log('Raw DB output:', products); // Add this line
        res.json(products);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Create new product
// Note: This route is protected and should only be accessible by admins
// router.post('/', adminAuth, async (req, res) => {
//   const { name, description, category, price, old_price, stock_quantity } = req.body;
//   const image_url = req.file ? `/uploads/${req.file.filename}` : null;  
//     try {
//         const [result] = await db.query(
//         `INSERT INTO products 
//          (name, description, category, price, old_price, image_url, stock_quantity) 
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [name, description, category, price, old_price, image_url, stock_quantity]
//         );
        
//         // Get the newly created product
//         const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
//         res.status(201).json(rows[0]);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Failed to create product' });
//     }
// });
// Update product
router.put('/:id', adminAuth, async (req, res) => {
  const productId = req.params.id;      
    const { name, description, category, price, old_price, stock_quantity } = req.body;

    try {
        await db.query(
            `UPDATE products SET 
             name = ?, description = ?, category = ?, price = ?, stock_quantity = ? 
             WHERE id = ?`,
            [name, description, category, price, stock_quantity, productId]
        );
        res.status(200).json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update product' });
    }
});     
// Delete product
router.delete('/:id', adminAuth, async (req, res) => {
  const productId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
}); 


// Create new product with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const old_price = req.body.old_price || null;
    const { name, description, category, price, stock_quantity } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO products 
       (name, description, category, price, old_price, image_url, stock_quantity) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, category, price, old_price, image_url, stock_quantity]
    );

    // Get the newly created product
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes (admin only in a real app)
router.post('/', adminAuth, productController.createProduct);
router.put('/:id', adminAuth, productController.updateProduct);
router.delete('/:id', adminAuth, productController.deleteProduct);

module.exports = router;