// =============================================
// Activity Controller — Phase 6
// =============================================
// Handles fetching the activity timeline for a project.
//
// The activity feed shows a reverse-chronological list
// of everything that happened in the project:
//   tasks created, statuses changed, comments posted, etc.
//
// Other controllers (taskController, commentController)
// write TO the activity log as a side effect of their actions.
// This controller only READS from it.
// =============================================

const ActivityLog = require('../models/activityModel');
const Project     = require('../models/projectModel');

// =============================================
// @desc    Get activity feed for a project
// @route   GET /api/projects/:id/activity
// @access  Private
// =============================================
// Flow:
//   1. Frontend loads the project detail page
//   2. Sends: GET /api/projects/5/activity
//   3. We verify the project exists
//   4. Return the last 50 activity entries (newest first)
const getActivity = async (req, res) => {
    try {
        const projectId = req.params.id;

        // Optional ?limit= query param to control how many entries to return.
        // Defaults to 50 if not specified. Capped at 100 to protect the server.
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);

        // ── Verify project exists ──
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const activities = await ActivityLog.findByProject(projectId, limit);

        res.status(200).json({
            success: true,
            count:   activities.length,
            data:    activities
        });

    } catch (error) {
        console.error('❌ getActivity error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching activity'
        });
    }
};

module.exports = { getActivity };
