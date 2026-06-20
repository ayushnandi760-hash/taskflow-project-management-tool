// =============================================
// Task Model — Phase 4
// =============================================
// The Model handles ALL database SQL for tasks.
// Controllers call these functions — they never
// write SQL directly. This separation keeps code
// clean and easy to test.
//
// Database table: tasks
//   id           → auto-incremented primary key
//   project_id   → which project this task belongs to
//   assigned_to  → which user is responsible (nullable)
//   title        → short task name
//   description  → longer details (optional)
//   priority     → 'Low' | 'Medium' | 'High'
//   status       → 'To Do' | 'In Progress' | 'Completed'
//   due_date     → optional deadline (DATE type)
//   created_at   → auto-set timestamp
// =============================================

const db = require('../config/db');

const Task = {

    // ---- CREATE: Insert a new task ----
    // Called when a user submits the "Create Task" form.
    // 'projectId' links the task to its parent project.
    // 'assignedTo' can be NULL if no one is assigned yet.
    create: async (projectId, assignedTo, title, description, priority, status, dueDate) => {
        const sql = `
            INSERT INTO tasks
                (project_id, assigned_to, title, description, priority, status, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            projectId,
            assignedTo || null,   // NULL if not assigned
            title,
            description || null,
            priority || 'Medium',
            status || 'To Do',
            dueDate || null
        ]);
        return result;
        // result.insertId = the new task's ID
    },

    // ---- READ ALL: Get all tasks for a project ----
    // Uses JOINs to pull in:
    //   - assignee's name and email (from users table)
    //
    // LEFT JOIN is important here:
    //   INNER JOIN would hide tasks with no assignee.
    //   LEFT JOIN keeps them and just shows NULL for user fields.
    findByProject: async (projectId) => {
        const sql = `
            SELECT
                t.id,
                t.project_id,
                t.title,
                t.description,
                t.priority,
                t.status,
                t.due_date,
                t.created_at,
                t.assigned_to,
                u.name   AS assignee_name,
                u.email  AS assignee_email
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = ?
            ORDER BY t.created_at DESC
        `;
        const [rows] = await db.execute(sql, [projectId]);
        return rows;
    },

    // ---- READ ONE: Get a single task by ID ----
    // Used when we need to verify a task exists before
    // updating or deleting it.
    findById: async (id) => {
        const sql = `
            SELECT
                t.id,
                t.project_id,
                t.title,
                t.description,
                t.priority,
                t.status,
                t.due_date,
                t.created_at,
                t.assigned_to,
                u.name   AS assignee_name,
                u.email  AS assignee_email
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id = ?
        `;
        const [rows] = await db.execute(sql, [id]);
        return rows[0]; // Return the first (and only) match, or undefined
    },

    // ---- UPDATE: Edit a task's full details ----
    // All fields can be updated in one call.
    // The controller validates the data before calling this.
    update: async (id, assignedTo, title, description, priority, status, dueDate) => {
        const sql = `
            UPDATE tasks
            SET
                assigned_to = ?,
                title       = ?,
                description = ?,
                priority    = ?,
                status      = ?,
                due_date    = ?
            WHERE id = ?
        `;
        const [result] = await db.execute(sql, [
            assignedTo || null,
            title,
            description || null,
            priority,
            status,
            dueDate || null,
            id
        ]);
        return result;
    },

    // ---- UPDATE STATUS ONLY: Quick status change ----
    // Used when a user changes just the status dropdown
    // without opening the full edit modal. Efficient — only
    // updates one column instead of all fields.
    updateStatus: async (id, status) => {
        const sql = 'UPDATE tasks SET status = ? WHERE id = ?';
        const [result] = await db.execute(sql, [status, id]);
        return result;
    },

    // ---- DELETE: Remove a task permanently ----
    delete: async (id) => {
        const sql = 'DELETE FROM tasks WHERE id = ?';
        const [result] = await db.execute(sql, [id]);
        return result;
    }
};

module.exports = Task;
