// =============================================
// User Controller
// =============================================
// Handles user-related operations like viewing profile.
// These routes are PROTECTED — only logged-in users
// with a valid JWT token can access them.

const User = require('../models/userModel');

// -------------------------------------------------
// @route   GET /api/users/profile
// @desc    Get logged-in user's profile
// @access  Private (requires JWT token)
// -------------------------------------------------
const getProfile = async (req, res, next) => {
    try {
        // req.user is set by the auth middleware after
        // verifying the JWT token. It contains the user's ID.
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile };
