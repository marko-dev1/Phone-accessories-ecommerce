// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool  = require('../config/db');

// Admin registration route (protected by secret key)
router.post('/register-admin', async (req, res) => {
    const { name, email, password, adminSecret } = req.body;
    
    try {
        // Verify admin secret key (store this in environment variables)
        if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid admin registration key'
            });
        }

        // Check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'admin']
        );

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin accont'
        });
    }
});

module.exports = router;