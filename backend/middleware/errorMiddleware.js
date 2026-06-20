// =============================================
// Error Handling Middleware
// =============================================
// This is a centralized error handler. Instead of
// writing error-handling code in every controller,
// we pass errors to this middleware using next(error).
// It catches all errors in one place and sends a
// clean, consistent error response to the client.

const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);

    // Default to 500 (Internal Server Error) if no status is set
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        // Only show error stack trace in development mode
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

// Handle 404 - Route Not Found
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
