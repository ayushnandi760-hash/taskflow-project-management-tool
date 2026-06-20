// =============================================
// User Routes
// =============================================
// These routes handle user-related operations.
// They are PROTECTED — the "protect" middleware
// runs BEFORE the controller, so only users with
// a valid JWT token can access these endpoints.

const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/users/profile → Get current user's profile (PROTECTED)
router.get('/profile', protect, getProfile);

module.exports = router;
