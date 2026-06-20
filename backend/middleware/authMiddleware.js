// =============================================
// JWT Authentication Middleware
// =============================================
// Middleware is a function that runs BETWEEN the request
// arriving and the controller handling it. Think of it
// as a security guard that checks your ID before
// letting you into a building.
//
// This middleware:
// 1. Checks if a JWT token is present in the request headers
// 2. Verifies the token is valid and not expired
// 3. Attaches the user's info to the request object
// 4. If anything fails, it blocks access with a 401 error

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    // --- Step 1: Check for token in headers ---
    // The token is sent in the "Authorization" header
    // Format: "Bearer <token>"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // --- Step 2: Extract the token ---
            // "Bearer abc123" → we split by space and take "abc123"
            token = req.headers.authorization.split(' ')[1];

            // --- Step 3: Verify the token ---
            // jwt.verify() checks if the token was created with
            // our secret key and hasn't expired.
            // If valid, it returns the decoded payload (contains user ID).
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // --- Step 4: Attach user to request ---
            // We fetch the user from the database (without password)
            // and attach it to req.user so controllers can use it.
            req.user = await User.findById(decoded.id);

            // --- Step 5: Move to the next middleware/controller ---
            next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token is invalid or expired'
            });
        }
    }

    // If no token was found at all
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided'
        });
    }
};

module.exports = { protect };
