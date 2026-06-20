// =============================================
// Comment Routes — Phase 6
// =============================================
// These routes are NESTED under /api/tasks/:id
// because comments belong to a specific task.
//
// Route Summary:
//   POST   /api/tasks/:id/comments              → Add a comment
//   GET    /api/tasks/:id/comments              → Get all comments
//   DELETE /api/tasks/:taskId/comments/:commentId → Delete a comment
//
// All routes are protected (JWT required).
// The :id in the path = the task ID.
//
// HOW NESTED ROUTES WORK:
//   In server.js we mount taskRoutes at '/api/tasks'.
//   Inside taskRoutes, we mount commentRoutes at '/:id/comments'.
//   So the full URL becomes: /api/tasks/42/comments
//   This clearly expresses: "comments OF task 42"
// =============================================

const express = require('express');
const router  = express.Router({ mergeParams: true });
// mergeParams: true → allows us to access :id from the parent route
// Without this, req.params.id would be undefined here.

const {
    addComment,
    getComments,
    deleteComment
} = require('../controllers/commentController');

const { protect } = require('../middleware/authMiddleware');

// POST   /api/tasks/:id/comments      → Post a new comment on a task
router.post('/',    protect, addComment);

// GET    /api/tasks/:id/comments      → Fetch all comments on a task
router.get('/',     protect, getComments);

// DELETE /api/tasks/:id/comments/:commentId  → Delete your own comment
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
