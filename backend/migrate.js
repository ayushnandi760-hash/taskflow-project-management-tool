// =============================================
// Database Migration - Phase 2 + Phase 3
// =============================================
// Run this script ONCE to create all tables:
//   node migrate.js   (from the backend directory)

const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('\n🔄 Running Migrations (Phase 2 + Phase 3)...\n');

// Run queries in sequence (Phase 2 first, then Phase 3)
// We MUST create 'projects' before 'project_members'
// because project_members has a FK pointing to projects.

const createProjects = `
    CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_project_user
            FOREIGN KEY (created_by)
            REFERENCES users(id)
            ON DELETE CASCADE
    )
`;

const createProjectMembers = `
    CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_membership (project_id, user_id),
        CONSTRAINT fk_member_project
            FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE,
        CONSTRAINT fk_member_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    )
`;

conn.query(createProjects, (err) => {
    if (err) {
        console.error('❌ Phase 2 migration failed:', err.message);
        conn.end();
        return;
    }
    console.log('✅ projects table — ready!');

    conn.query(createProjectMembers, (err2) => {
        if (err2) {
            console.error('❌ Phase 3 migration failed:', err2.message);
        } else {
            console.log('✅ project_members table — ready!');
            console.log('\n🚀 All migrations complete. Run: npm start\n');
        }
        conn.end();
    });
});

