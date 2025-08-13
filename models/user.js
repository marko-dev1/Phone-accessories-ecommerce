const db = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async create(userData) {
        const { name, email, phone, password, address } = userData;
        const [result] = await db.query(
            'INSERT INTO users (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, password, address]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT id, name, email, phone, address FROM users WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = User;


