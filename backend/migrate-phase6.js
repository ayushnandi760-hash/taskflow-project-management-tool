// =============================================
// Database Migration — Phase 6
// Comments & Activity Log Tables
// =============================================
// Run this script ONCE to create the two new tables:
//   node migrate-phase6.js   (from the backend folder)
//
// IMPORTANT: Run AFTER migrate-phase4.js!
// These tables depend on:
//   - users    (id)
//   - tasks    (id)
//   - projects (id)
//
// Table 1: task_comments
//   Stores comments that team members write on tasks.
//   ON DELETE CASCADE on task_id:
//     When a task is deleted, all its comments go with it.
//   ON DELETE CASCADE on user_id:
//     When a user is deleted, their comments are removed.
//
// Table 2: activity_log
//   A permanent record of every important action in a project.
//   WHO did WHAT and WHEN.
//   ON DELETE CASCADE on project_id + user_id:
//     Clean up log entries when the project or user is deleted.
// =============================================

const mysql  = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const conn = mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('\n🔄 Running Phase 6 Migration (Comments & Activity Log)...\n');

// ── Table 1: task_comments ──────────────────
const createComments = `
    CREATE TABLE IF NOT EXISTS task_comments (
        id         INT AUTO_INCREMENT PRIMARY KEY,

        -- Which task is this comment on?
        -- ON DELETE CASCADE: delete task → delete all its comments
        task_id    INT NOT NULL,

        -- Which user wrote this comment?
        -- ON DELETE CASCADE: delete user → delete their comments
        user_id    INT NOT NULL,

        -- The comment text (up to 65,535 chars via TEXT)
        comment    TEXT NOT NULL,

        -- Auto-set to the moment the comment is posted
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- ── Foreign Keys ──
        CONSTRAINT fk_comment_task
            FOREIGN KEY (task_id)
            REFERENCES tasks(id)
            ON DELETE CASCADE,

        CONSTRAINT fk_comment_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    )
`;

// ── Table 2: activity_log ───────────────────
const createActivityLog = `
    CREATE TABLE IF NOT EXISTS activity_log (
        id         INT AUTO_INCREMENT PRIMARY KEY,

        -- Which project did this action happen in?
        project_id INT NOT NULL,

        -- Who performed the action? NULL = system action
        user_id    INT DEFAULT NULL,

        -- Human-readable description of what happened
        -- e.g. "Created task 'Fix login bug'"
        -- e.g. "Moved task to In Progress"
        -- e.g. "Added a comment on 'Fix login bug'"
        action     VARCHAR(500) NOT NULL,

        -- When did it happen?
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- ── Foreign Keys ──
        CONSTRAINT fk_activity_project
            FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE,

        CONSTRAINT fk_activity_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE SET NULL
    )
`;

// Run both queries in sequence
conn.query(createComments, (err) => {
    if (err) {
        console.error('❌ task_comments table failed:', err.message);
        conn.end();
        return;
    }
    console.log('✅ task_comments table — ready!');

    conn.query(createActivityLog, (err2) => {
        if (err2) {
            console.error('❌ activity_log table failed:', err2.message);
        } else {
            console.log('✅ activity_log table   — ready!');
            console.log('\n🚀 Phase 6 migration complete!');
            console.log('   Restart the server with: npm start\n');
        }
        conn.end();
    });
});
