// =============================================
// Project Routes
// =============================================
// Routes are the "map" that connects a URL + HTTP Method
// to a specific controller function.
//
// All routes here are PROTECTED — the user must send
// a valid JWT token in the Authorization header.
//
// The 'protect' middleware checks the token BEFORE
// the controller runs. If the token is invalid, the
// request is blocked and the controller never runs.
//
// HTTP Methods Explained:
//   POST   → Create something new
//   GET    → Read / Retrieve data
//   PUT    → Update / Replace data
//   DELETE → Remove data
// =============================================

const express = require('express');
const router = express.Router();

// Import project controller functions
const {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

// Import member controller functions (Phase 3)
const {
    addMember,
    getMembers,
    removeMember
} = require('../controllers/projectMemberController');

// Import the auth middleware (JWT guard)
const { protect } = require('../middleware/authMiddleware');

// Import activity routes (Phase 6)
const activityRoutes = require('./activityRoutes');

// =============================================
// Phase 2 — Project CRUD Routes
// =============================================

// POST /api/projects  → Create a new project
router.post('/', protect, createProject);

// GET /api/projects  → Get all projects
router.get('/', protect, getAllProjects);

// GET /api/projects/:id  → Get one project by ID
router.get('/:id', protect, getProjectById);

// PUT /api/projects/:id  → Update a project
router.put('/:id', protect, updateProject);

// DELETE /api/projects/:id  → Delete a project
router.delete('/:id', protect, deleteProject);

// =============================================
// Phase 3 — Project Member Routes
// =============================================
// These routes are NESTED under a project:
//   /api/projects/:id/members
//
// The ':id' here refers to the project ID.
// The ':userId' refers to the user being removed.
//
// Why nested URLs?
// Because members BELONG TO a project. The URL
// structure reflects that relationship clearly.
// ─────────────────────────────────────────────

// POST /api/projects/:id/members
// → Add a user to the project (by email)
router.post('/:id/members', protect, addMember);

// GET /api/projects/:id/members
// → Get all members of the project
router.get('/:id/members', protect, getMembers);

// DELETE /api/projects/:id/members/:userId
// → Remove a specific user from the project
// ':userId' = the ID of the user to remove
router.delete('/:id/members/:userId', protect, removeMember);

// =============================================
// Phase 6 — Nested Activity Routes
// =============================================
router.use('/:id/activity', activityRoutes);

module.exports = router;
