// =============================================
// Database Configuration
// =============================================
// This file creates a connection pool to MySQL.
// A "pool" is like having multiple database connections
// ready to use, instead of creating a new one each time.
// This makes our app faster and more efficient.

const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,   // Wait if all connections are in use
    connectionLimit: 10,        // Maximum 10 connections at once
    queueLimit: 0               // Unlimited waiting requests
});

// Use promise-based queries (async/await friendly)
const promisePool = pool.promise();

module.exports = promisePool;
