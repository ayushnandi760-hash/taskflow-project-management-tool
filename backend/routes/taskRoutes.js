// =============================================
// Task Routes — Phase 4
// =============================================
// Routes are the "map" that connects a URL + HTTP method
// to a specific controller function.
//
// All task routes are PROTECTED — the user must send
// a valid JWT token. The 'protect' middleware verifies
// the token before any controller runs.
//
// Base path (mounted in server.js): /api/tasks
//
// Route Summary:
//   POST   /api/tasks          → Create a task
//   GET    /api/tasks          → Get all tasks (filter by ?project_id=)
//   PUT    /api/tasks/:id      → Update a task
//   DELETE /api/tasks/:id      → Delete a task
// =============================================

const express = require('express');
const router = express.Router();

// Import task controller functions
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController');

const { protect } = require('../middleware/authMiddleware');

// Import comment routes (Phase 6)
const commentRoutes = require('./commentRoutes');

// =============================================
// Phase 4 — Task CRUD Routes
// =============================================

// POST /api/tasks
// → Create a new task inside a project
// Body: { project_id, title, description, priority, status, due_date, assigned_to }
router.post('/', protect, createTask);

// GET /api/tasks?project_id=5
// → Get all tasks belonging to project #5
// The project_id is passed as a query parameter (not in the URL path)
router.get('/', protect, getTasks);

// PUT /api/tasks/:id
// → Update task #42's details
// Body: { title, description, priority, status, due_date, assigned_to }
router.put('/:id', protect, updateTask);

// DELETE /api/tasks/:id
// → Permanently delete task #42
router.delete('/:id', protect, deleteTask);

// =============================================
// Phase 6 — Nested Comment Routes
// =============================================
// Any request starting with /api/tasks/:id/comments
// will be forwarded to the commentRoutes file.
router.use('/:id/comments', commentRoutes);

module.exports = router;
