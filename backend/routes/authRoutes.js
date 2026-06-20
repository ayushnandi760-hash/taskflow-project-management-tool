// =============================================
// Authentication Routes
// =============================================
// Routes are like a "map" that tells Express:
// "When someone visits THIS URL with THIS method,
//  run THIS controller function."
//
// These routes handle registration and login.
// They are PUBLIC — no JWT token needed.

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register → Register a new user
router.post('/register', register);

// POST /api/auth/login → Login and get JWT token
router.post('/login', login);

module.exports = router;
