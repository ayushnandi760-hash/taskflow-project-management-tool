// =============================================
// Authentication Controller
// =============================================
// Controllers contain the "business logic" — the rules
// of how our app works. They receive requests from routes,
// process data, talk to models, and send responses.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// -------------------------------------------------
// Helper: Generate JWT Token
// -------------------------------------------------
// This function creates a JWT token containing the user's ID.
// The token expires after the time set in .env (e.g., 30 days).
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// -------------------------------------------------
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (anyone can access)
// -------------------------------------------------
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // --- Validation ---
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        // Check if email is already registered
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        // --- Hash the password ---
        // bcrypt.genSalt(10) creates a "salt" with 10 rounds of processing.
        // A salt is random data added to the password before hashing,
        // so even identical passwords produce different hashes.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- Save user to database ---
        const result = await User.create(name, email, hashedPassword);

        // --- Generate JWT token ---
        const token = generateToken(result.insertId);

        // --- Send response ---
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: result.insertId,
                name,
                email,
                token
            }
        });

    } catch (error) {
        next(error);  // Pass error to error-handling middleware
    }
};

// -------------------------------------------------
// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public (anyone can access)
// -------------------------------------------------
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // --- Validation ---
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // --- Check if user exists ---
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // --- Compare passwords ---
        // bcrypt.compare() hashes the entered password with the same
        // salt and checks if it matches the stored hash.
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // --- Generate JWT token ---
        const token = generateToken(user.id);

        // --- Send response ---
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { register, login };
