// =============================================
// Activity Routes — Phase 6
// =============================================
// These routes are NESTED under /api/projects/:id
// because the activity feed is scoped to a specific project.
//
// Route Summary:
//   GET  /api/projects/:id/activity  → Fetch project activity timeline
//
// All routes are protected (JWT required).
// The :id in the path = the project ID.
//
// HOW NESTED ROUTES WORK:
//   In server.js we mount projectRoutes at '/api/projects'.
//   Inside projectRoutes, we mount activityRoutes at '/:id/activity'.
//   So the full URL becomes: /api/projects/5/activity
// =============================================

const express = require('express');
const router  = express.Router({ mergeParams: true });
// mergeParams: true allows access to the parent :id parameter

const { getActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/projects/:id/activity
router.get('/', protect, getActivity);

module.exports = router;
