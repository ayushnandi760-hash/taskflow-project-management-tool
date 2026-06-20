// =============================================
// User Model
// =============================================
// The Model is responsible for talking to the database.
// It contains functions that run SQL queries.
// Controllers call these functions — they never write
// SQL queries directly. This keeps our code organized.

const db = require('../config/db');

const User = {

    // ---- Create a new user ----
    // Used during registration
    create: async (name, email, hashedPassword) => {
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        const [result] = await db.execute(sql, [name, email, hashedPassword]);
        return result;
    },

    // ---- Find a user by email ----
    // Used during login to check if the email exists
    findByEmail: async (email) => {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.execute(sql, [email]);
        return rows[0];  // Return the first (and only) matching user
    },

    // ---- Find a user by ID ----
    // Used to fetch profile data (after JWT verification)
    findById: async (id) => {
        const sql = 'SELECT id, name, email, role, created_at FROM users WHERE id = ?';
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    }
};

module.exports = User;
