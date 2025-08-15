
// config/database.js
// const mysql = require('mysql2/promise'); 
// require('dotenv').config();

// const pool = mysql.createPool({
//   host: process.env.MYSQLHOST,
//   user: process.env.MYSQLUSER,
//   password: process.env.MYSQLPASSWORD,
//   database: process.env.MYSQLDATABASE,
//   port: process.env.MYSQLPORT,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });


// module.exports = pool;

const mysql = require('mysql2/promise'); 
require('dotenv').config();
const mysql = require('mysql2');

// Use pool for stability
const db = mysql.createPool({
  host: 'mysql.railway.internal',
  user: 'root',
  password: 'UtqviDYUsrfAipsjwIspemFUblDfZrpI',
  database: 'railway',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Allow running multiple CREATE TABLE statements
});

// Test connection and create tables
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL Database');
  connection.release();
  createTables();
});

function createTables() {
  const tableQueries = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL,
      password VARCHAR(255) NOT NULL,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      old_price DECIMAL(10, 2),
      image_url VARCHAR(255),
      stock_quantity INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      payment_method ENUM('M-Pesa', 'Cash on Delivery', 'Card') NOT NULL,
      payment_status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
      delivery_address TEXT NOT NULL,
      status ENUM('Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Processing',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `;

  db.query(tableQueries, (err) => {
    if (err) {
      console.error('Error creating tables:', err);
    } else {
      console.log('Tables checked/created successfully');
    }
  });
}

module.exports = db;
