// =============================================
// Database Migration — Phase 4 (Tasks Table)
// =============================================
// Run this script ONCE to add the tasks table:
//   node migrate-phase4.js   (from the backend directory)
//
// IMPORTANT: Run AFTER the Phase 2/3 migration!
// The tasks table has FOREIGN KEYS pointing to:
//   - projects (id)  →  must exist first
//   - users    (id)  →  must exist first
//
// Foreign Key Rules:
//   ON DELETE CASCADE on project_id:
//     If a project is deleted, ALL its tasks are also deleted.
//     This prevents "orphan" tasks with no parent project.
//
//   ON DELETE SET NULL on assigned_to:
//     If the assigned user is deleted, the task stays but
//     becomes unassigned (assigned_to = NULL). The task
//     is NOT deleted just because the person left.
// =============================================

const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('\n🔄 Running Phase 4 Migration (Tasks Table)...\n');

const createTasks = `
    CREATE TABLE IF NOT EXISTS tasks (
        id          INT AUTO_INCREMENT PRIMARY KEY,

        -- Which project does this task belong to?
        -- REQUIRED — a task must always have a parent project.
        -- ON DELETE CASCADE: deleting the project deletes all its tasks.
        project_id  INT NOT NULL,

        -- Who is responsible for this task?
        -- OPTIONAL — can be NULL (unassigned).
        -- ON DELETE SET NULL: if the user is deleted, task stays unassigned.
        assigned_to INT DEFAULT NULL,

        -- Task details
        title       VARCHAR(255) NOT NULL,
        description TEXT,

        -- Priority level: Low, Medium, or High
        -- ENUM restricts what values can be stored.
        -- DEFAULT 'Medium' — sensible default.
        priority    ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',

        -- Lifecycle status: To Do → In Progress → Completed
        status      ENUM('To Do', 'In Progress', 'Completed') NOT NULL DEFAULT 'To Do',

        -- Optional deadline (DATE = YYYY-MM-DD, no time component)
        due_date    DATE DEFAULT NULL,

        -- Auto-set when the task is first created
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- ---- FOREIGN KEY CONSTRAINTS ----
        -- Link project_id to projects.id
        CONSTRAINT fk_task_project
            FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE,

        -- Link assigned_to to users.id
        CONSTRAINT fk_task_user
            FOREIGN KEY (assigned_to)
            REFERENCES users(id)
            ON DELETE SET NULL
    )
`;

conn.query(createTasks, (err) => {
    if (err) {
        console.error('❌ Phase 4 migration failed:', err.message);
    } else {
        console.log('✅ tasks table — ready!');
        console.log('\n🚀 Phase 4 migration complete. Restart the server with: npm start\n');
    }
    conn.end();
});
