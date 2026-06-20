// =============================================
// Task Controller — Phase 4
// =============================================
// Controllers sit between the Route and the Model.
// Their job:
//   1. Read the request (req.body, req.params)
//   2. Validate the input
//   3. Call the Model to talk to the database
//   4. Send back a JSON response
//
// Each function handles ONE API endpoint.
// All routes are protected (JWT required).
// =============================================

const Task        = require('../models/taskModel');
const Project     = require('../models/projectModel');
const ActivityLog = require('../models/activityModel');

// Valid values — used for validation
const VALID_STATUSES  = ['To Do', 'In Progress', 'Completed'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

// =============================================
// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
// =============================================
// Flow:
//   1. User fills the "Create Task" form inside a project
//   2. Frontend sends: { project_id, title, description,
//                        priority, status, due_date, assigned_to }
//   3. We validate the fields
//   4. We verify the project exists
//   5. We insert the task into the database
//   6. Return the new task's ID
const createTask = async (req, res) => {
    try {
        const {
            project_id,
            assigned_to,
            title,
            description,
            priority,
            status,
            due_date
        } = req.body;

        // --- Step 1: Validate required fields ---
        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: 'project_id is required'
            });
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Task title is required'
            });
        }

        // --- Step 2: Validate enum values (if provided) ---
        if (priority && !VALID_PRIORITIES.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`
            });
        }

        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
            });
        }

        // --- Step 3: Verify the project exists ---
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // --- Step 4: Insert into the database ---
        const result = await Task.create(
            project_id,
            assigned_to || null,
            title.trim(),
            description || '',
            priority || 'Medium',
            status || 'To Do',
            due_date || null
        );

        // --- Step 5: Fetch the newly created task to return full data ---
        const newTask = await Task.findById(result.insertId);

        // --- Step 6: Write to activity log ---
        // We log: who created what task, in which project
        try {
            await ActivityLog.log(
                project_id,
                req.user.id,
                `Created task "${newTask.title}"`
            );
        } catch (logErr) {
            console.warn('⚠️ Activity log failed (create):', logErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Task created successfully!',
            data: newTask
        });

    } catch (error) {
        console.error('❌ createTask error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while creating task'
        });
    }
};

// =============================================
// @desc    Get all tasks for a project
// @route   GET /api/tasks?project_id=5
// @access  Private
// =============================================
// Flow:
//   1. Frontend requests: GET /api/tasks?project_id=5
//   2. We query the tasks table filtered by project_id
//   3. We JOIN with users to get assignee details
//   4. Return the list
const getTasks = async (req, res) => {
    try {
        // project_id comes from the query string: ?project_id=5
        const { project_id } = req.query;

        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: 'project_id query parameter is required'
            });
        }

        // Verify the project exists
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const tasks = await Task.findByProject(project_id);

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });

    } catch (error) {
        console.error('❌ getTasks error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching tasks'
        });
    }
};

// =============================================
// @desc    Update a task (full edit)
// @route   PUT /api/tasks/:id
// @access  Private
// =============================================
// Flow:
//   1. User edits the task and submits the form
//   2. Frontend sends all task fields
//   3. We validate fields
//   4. We verify the task exists
//   5. We update the database row
//   6. Return the refreshed task data
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            assigned_to,
            title,
            description,
            priority,
            status,
            due_date
        } = req.body;

        // --- Validate title ---
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Task title is required'
            });
        }

        // --- Validate enum fields ---
        if (priority && !VALID_PRIORITIES.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`
            });
        }

        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
            });
        }

        // --- Check that the task exists ---
        const existing = await Task.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // --- Perform the update ---
        await Task.update(
            id,
            assigned_to || null,
            title.trim(),
            description || '',
            priority || existing.priority,
            status || existing.status,
            due_date || null
        );

        // --- Fetch fresh data to return ---
        const updated = await Task.findById(id);

        // --- Log the update activity ---
        // Detect what changed for a more descriptive log message
        let changeDesc = 'Updated task';
        if (status && status !== existing.status) {
            changeDesc = `Moved task "${updated.title}" to ${status}`;
        } else {
            changeDesc = `Updated task "${updated.title}"`;
        }
        try {
            await ActivityLog.log(updated.project_id, req.user.id, changeDesc);
        } catch (logErr) {
            console.warn('⚠️ Activity log failed (update):', logErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Task updated successfully!',
            data: updated
        });

    } catch (error) {
        console.error('❌ updateTask error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while updating task'
        });
    }
};

// =============================================
// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
// =============================================
// Flow:
//   1. User clicks "Delete" on a task
//   2. Frontend sends: DELETE /api/tasks/42
//   3. We verify the task exists
//   4. We delete it
//   5. Return success confirmation
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        // --- Verify task exists ---
        const existing = await Task.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        await Task.delete(id);

        // --- Log the delete activity ---
        try {
            await ActivityLog.log(
                existing.project_id,
                req.user.id,
                `Deleted task "${existing.title}"`
            );
        } catch (logErr) {
            console.warn('⚠️ Activity log failed (delete):', logErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully!'
        });

    } catch (error) {
        console.error('❌ deleteTask error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting task'
        });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
