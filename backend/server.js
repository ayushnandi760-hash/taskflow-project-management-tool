// =============================================
// TaskFlow Backend Server - Entry Point (Phase 4)
// =============================================
// This is the MAIN file that starts our entire backend.
// Think of it as the "brain" that connects everything:
// - Loads environment variables
// - Sets up Express (our web framework)
// - Connects middleware (security, parsing, errors)
// - Mounts routes (URLs our app responds to)
// - Starts listening for requests

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST (before anything else uses them)
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Initialize Express app
const app = express();

// =============================================
// Global Middleware
// =============================================

// CORS - Allow frontend to make requests to this backend
// Without this, the browser would block requests from
// a different origin (e.g., frontend on port 5500, backend on port 5000)
app.use(cors());

// Parse JSON request bodies
// When frontend sends JSON data, this converts it to a JS object
// accessible via req.body
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend folder
// This lets us serve HTML, CSS, JS files directly
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// =============================================
// API Routes
// =============================================

// Mount auth routes at /api/auth
// So /register becomes /api/auth/register
app.use('/api/auth', authRoutes);

// Mount user routes at /api/users
// So /profile becomes /api/users/profile
app.use('/api/users', userRoutes);

// Mount project routes at /api/projects
// Handles Create, Read, Update, Delete for projects
app.use('/api/projects', projectRoutes);

// Mount task routes at /api/tasks (Phase 4)
// Handles task CRUD: create, list, update, delete
app.use('/api/tasks', taskRoutes);

// =============================================
// Root Route
// =============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// =============================================
// Error Handling (must be AFTER routes)
// =============================================
app.use(notFound);      // Handle 404 errors
app.use(errorHandler);  // Handle all other errors

// =============================================
// Start Server
// =============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 TaskFlow Server is running!`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
