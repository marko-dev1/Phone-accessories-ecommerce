
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Route imports
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Session config
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_secret';
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Static files
app.use(express.static('public'));

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', adminRoutes);

// Route guards
function requireLogin(req, res, next) {
  if (req.session && req.session.email) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Page routes
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/product-upload.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product-upload.html'));
});

app.get('/', (req, res) => {
  res.send('Welcome to VitronicsHub API!');
});

app.get('/api/auth/email', (req, res) => {
  console.log("Session object:", req.session);
  if (req.session && req.session.email) {
    res.json({ email: req.session.email });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
