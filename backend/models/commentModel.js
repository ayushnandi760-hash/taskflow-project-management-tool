// =============================================
// Comment Model — Phase 6
// =============================================
// Handles ALL database SQL for task_comments.
//
// WHAT IS A MODEL?
//   A model is the layer that talks directly to
//   the database. It speaks pure SQL. No business
//   logic lives here — just "write data" and
//   "read data" functions.
//
// Why a separate model file?
//   If we later switch databases (MySQL → PostgreSQL),
//   we only change code in the model — nothing else.
// =============================================

const db = require('../config/db');

const Comment = {

    // ---- CREATE: Post a new comment ----
    // Called when a user submits the comment form on a task.
    // Parameters:
    //   taskId  → which task this comment belongs to
    //   userId  → who is posting (from the JWT token)
    //   comment → the text content
    create: async (taskId, userId, comment) => {
        const sql = `
            INSERT INTO task_comments (task_id, user_id, comment)
            VALUES (?, ?, ?)
        `;
        const [result] = await db.execute(sql, [taskId, userId, comment]);
        return result;
        // result.insertId = the new comment's ID
    },

    // ---- READ ALL: Get all comments for a task ----
    // Uses JOIN to bring in the commenter's name and avatar initial.
    //
    // WHY JOIN users?
    //   We store user_id (a number) in the comment.
    //   The frontend needs the actual NAME to display.
    //   Instead of making two queries, we JOIN the tables in SQL
    //   and get everything in one trip to the database.
    //
    // ORDER BY created_at ASC = oldest comment first (chronological).
    findByTask: async (taskId) => {
        const sql = `
            SELECT
                c.id,
                c.task_id,
                c.comment,
                c.created_at,
                u.id    AS user_id,
                u.name  AS user_name,
                u.email AS user_email
            FROM task_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.task_id = ?
            ORDER BY c.created_at ASC
        `;
        // ASC = ascending = oldest first (like a chat thread)
        const [rows] = await db.execute(sql, [taskId]);
        return rows;
    },

    // ---- DELETE: Remove a single comment ----
    // We pass userId so we can verify ownership in the controller:
    // "only the person who wrote it can delete it"
    delete: async (commentId, userId) => {
        const sql = 'DELETE FROM task_comments WHERE id = ? AND user_id = ?';
        const [result] = await db.execute(sql, [commentId, userId]);
        return result;
        // result.affectedRows = 0 if the comment didn't belong to this user
    }
};

module.exports = Comment;
