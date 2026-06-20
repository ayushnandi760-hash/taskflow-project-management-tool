// =============================================
// Activity Log Model — Phase 6
// =============================================
// Handles ALL database SQL for activity_log.
//
// WHAT IS AN ACTIVITY LOG?
//   Every time something important happens in a project,
//   we write one line into this table:
//     "Alice created task 'Fix the login bug'"
//     "Bob moved task to In Progress"
//     "Alice commented on 'Fix the login bug'"
//
//   This table NEVER gets rows deleted (unless the project
//   or user is removed). It's an APPEND-ONLY record.
//   Think of it like a bank statement — transactions are
//   never erased, only added.
//
// This is called an AUDIT LOG or ACTIVITY FEED.
// =============================================

const db = require('../config/db');

const ActivityLog = {

    // ---- LOG: Write one activity line ----
    // Called by controllers whenever something noteworthy happens.
    // Parameters:
    //   projectId → which project the action happened in
    //   userId    → who performed it (from JWT token)
    //   action    → human-readable string describing what happened
    //
    // EXAMPLES of action strings:
    //   'Created task "Fix login bug"'
    //   'Updated task "Fix login bug" status to In Progress'
    //   'Added a comment on "Fix login bug"'
    //   'Deleted task "Old feature"'
    //   'Added member Alice Johnson to the project'
    log: async (projectId, userId, action) => {
        const sql = `
            INSERT INTO activity_log (project_id, user_id, action)
            VALUES (?, ?, ?)
        `;
        const [result] = await db.execute(sql, [projectId, userId, action]);
        return result;
    },

    // ---- READ: Get recent activity for a project ----
    // Returns the N most recent entries, newest first.
    // JOINs with users to get the actor's name.
    //
    // LIMIT ? → We don't want to send 10,000 rows to the frontend.
    // We paginate: "give me the last 50 events". This keeps the
    // response small and fast.
    //
    // LEFT JOIN (not INNER JOIN) because user_id can be NULL
    // (system-generated actions have no user).
    findByProject: async (projectId, limit = 50) => {
        const sql = `
            SELECT
                a.id,
                a.action,
                a.created_at,
                u.id    AS user_id,
                u.name  AS user_name,
                u.email AS user_email
            FROM activity_log a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.project_id = ?
            ORDER BY a.created_at DESC
            LIMIT ?
        `;
        // DESC = descending = newest first (most relevant at the top)
        const [rows] = await db.execute(sql, [projectId, limit]);
        return rows;
    }
};

module.exports = ActivityLog;
