// =============================================
// Comment Controller — Phase 6
// =============================================
// Handles the business logic for task comments.
//
// WHAT IS A CONTROLLER?
//   Controllers sit between the Route (URL) and the Model (DB).
//   Their three jobs:
//     1. Read the request (req.body, req.params, req.user)
//     2. Validate the data
//     3. Call the Model, then send back JSON
//
// This controller also writes to activity_log every time
// a comment is posted. This is called a "side effect" —
// the primary job is saving the comment, but as a bonus
// we also record the event in the audit trail.
// =============================================

const Comment      = require('../models/commentModel');
const Task         = require('../models/taskModel');
const ActivityLog  = require('../models/activityModel');

// =============================================
// @desc    Post a comment on a task
// @route   POST /api/tasks/:id/comments
// @access  Private
// =============================================
// Flow:
//   1. User types a comment and hits "Post"
//   2. Frontend sends: POST /api/tasks/42/comments
//      Body: { comment: "Can we move this to next sprint?" }
//   3. We validate the task exists
//   4. We save the comment
//   5. We also write to activity_log
//   6. Return the new comment with user info
const addComment = async (req, res) => {
    try {
        const taskId = req.params.id;           // from the URL:  /tasks/42/comments
        const userId = req.user.id;             // from JWT token (added by protect middleware)
        const { comment } = req.body;

        // ── Validate comment text ──
        if (!comment || comment.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        if (comment.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be 2000 characters or less'
            });
        }

        // ── Verify the task exists ──
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // ── Save the comment ──
        const result = await Comment.create(taskId, userId, comment.trim());

        // ── Fetch the saved comment with user info to return ──
        // (The create() only returns insertId, not the full row)
        const comments = await Comment.findByTask(taskId);
        const newComment = comments.find(c => c.id === result.insertId);

        // ── Log the activity (side effect) ──
        // We log this to the project's activity feed.
        // task.project_id links the task to its project.
        // req.user.name is the commenter's name (set by protect middleware).
        try {
            await ActivityLog.log(
                task.project_id,
                userId,
                `Commented on task "${task.title}"`
            );
        } catch (logErr) {
            // Activity logging is non-critical — if it fails,
            // the comment was still saved successfully.
            console.warn('⚠️ Failed to write activity log:', logErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Comment added!',
            data: newComment
        });

    } catch (error) {
        console.error('❌ addComment error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while adding comment'
        });
    }
};

// =============================================
// @desc    Get all comments on a task
// @route   GET /api/tasks/:id/comments
// @access  Private
// =============================================
// Flow:
//   1. Frontend opens a task's comment section
//   2. Sends: GET /api/tasks/42/comments
//   3. We verify the task exists
//   4. Return all comments ordered oldest-first (like a chat)
const getComments = async (req, res) => {
    try {
        const taskId = req.params.id;

        // ── Verify task exists ──
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const comments = await Comment.findByTask(taskId);

        res.status(200).json({
            success: true,
            count:   comments.length,
            data:    comments
        });

    } catch (error) {
        console.error('❌ getComments error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching comments'
        });
    }
};

// =============================================
// @desc    Delete a comment
// @route   DELETE /api/tasks/:taskId/comments/:commentId
// @access  Private (owner only)
// =============================================
// Flow:
//   1. User clicks the delete icon on their own comment
//   2. Frontend sends: DELETE /api/tasks/42/comments/7
//   3. We try to delete it — but ONLY if it belongs to the user
//      (the SQL query has WHERE id=? AND user_id=?)
//   4. If 0 rows affected → either not found OR not the owner
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId        = req.user.id;

        const result = await Comment.delete(commentId, userId);

        // affectedRows = 0 means the row didn't exist OR
        // the user doesn't own this comment
        if (result.affectedRows === 0) {
            return res.status(403).json({
                success: false,
                message: 'Comment not found or you are not the owner'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Comment deleted'
        });

    } catch (error) {
        console.error('❌ deleteComment error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting comment'
        });
    }
};

module.exports = { addComment, getComments, deleteComment };
