// =============================================
// Project Model
// =============================================
// The Model is responsible for ALL database operations
// related to projects. Controllers call these functions —
// they never write SQL directly. This keeps code clean.
//
// Think of the Model like a "translator":
//   - Controller says: "Give me all projects"
//   - Model translates that into SQL and returns results
//
// CRUD = Create, Read, Update, Delete
// =============================================

const db = require('../config/db');

const Project = {

    // ---- CREATE: Insert a new project ----
    // Called when a user submits the "Create Project" form.
    // 'userId' is the logged-in user's ID (from JWT token).
    create: async (name, description, userId) => {
        const sql = `
            INSERT INTO projects (name, description, created_by)
            VALUES (?, ?, ?)
        `;
        const [result] = await db.execute(sql, [name, description, userId]);
        return result;
        // result.insertId contains the new project's ID
    },

    // ---- READ ALL: Get all projects ----
    // Returns every project along with the creator's name.
    // We use a JOIN to pull user data from the 'users' table.
    //
    // SQL JOIN Explained:
    //   projects table has: created_by = 5
    //   users table has:    id = 5, name = "Alice"
    //   JOIN matches them and gives us the user's name!
    findAll: async () => {
        const sql = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.created_at,
                u.id AS creator_id,
                u.name AS creator_name,
                u.email AS creator_email
            FROM projects p
            JOIN users u ON p.created_by = u.id
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.execute(sql);
        return rows;
    },

    // ---- READ ONE: Get a single project by ID ----
    // Used on the "Project Details" page.
    findById: async (id) => {
        const sql = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.created_at,
                p.created_by,
                u.id AS creator_id,
                u.name AS creator_name,
                u.email AS creator_email
            FROM projects p
            JOIN users u ON p.created_by = u.id
            WHERE p.id = ?
        `;
        const [rows] = await db.execute(sql, [id]);
        return rows[0]; // Return the first (and only) matching project
    },

    // ---- UPDATE: Edit an existing project ----
    // Only updates name and description.
    // 'id' tells us WHICH project to update.
    update: async (id, name, description) => {
        const sql = `
            UPDATE projects
            SET name = ?, description = ?
            WHERE id = ?
        `;
        const [result] = await db.execute(sql, [name, description, id]);
        return result;
        // result.affectedRows tells us how many rows were changed
    },

    // ---- DELETE: Remove a project ----
    // Permanently deletes the project from the database.
    // In future phases, we'll check ownership before deleting.
    delete: async (id) => {
        const sql = 'DELETE FROM projects WHERE id = ?';
        const [result] = await db.execute(sql, [id]);
        return result;
    }
};

module.exports = Project;
