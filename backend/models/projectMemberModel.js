// =============================================
// Project Member Model
// =============================================
// This model handles all database operations for the
// 'project_members' table — the JUNCTION TABLE that
// connects users to projects in a Many-to-Many relationship.
//
// KEY CONCEPT: Why a Junction Table?
// ─────────────────────────────────────────────
// A user can be a member of MANY projects.
// A project can have MANY members.
// This is called a "Many-to-Many" relationship.
//
// You CANNOT store this in just two tables cleanly.
// The solution? A THIRD table (junction table) that
// holds pairs of (project_id, user_id) — each row
// represents ONE membership.
//
// Example:
//   project_members table:
//   ┌────┬────────────┬─────────┐
//   │ id │ project_id │ user_id │
//   ├────┼────────────┼─────────┤
//   │  1 │     1      │    2    │  ← User 2 is in Project 1
//   │  2 │     1      │    3    │  ← User 3 is in Project 1
//   │  3 │     2      │    2    │  ← User 2 is also in Project 2
//   └────┴────────────┴─────────┘
// =============================================

const db = require('../config/db');

const ProjectMember = {

    // ---- ADD MEMBER: Insert a new membership record ----
    // Creates a row in project_members linking a user to a project.
    // Called when someone is added to a project.
    addMember: async (projectId, userId) => {
        const sql = `
            INSERT INTO project_members (project_id, user_id)
            VALUES (?, ?)
        `;
        const [result] = await db.execute(sql, [projectId, userId]);
        return result;
    },

    // ---- CHECK: Is this user already a member? ----
    // We check this BEFORE adding to prevent duplicate memberships.
    // If a user is already in the project, we return an error.
    isMember: async (projectId, userId) => {
        const sql = `
            SELECT id FROM project_members
            WHERE project_id = ? AND user_id = ?
        `;
        const [rows] = await db.execute(sql, [projectId, userId]);
        return rows.length > 0; // true = already a member
    },

    // ---- GET ALL MEMBERS of a project ----
    // Uses a JOIN to pull each member's user details.
    // The result is a list of users (with their names, emails,
    // and the date they joined the project).
    //
    // SQL JOIN recap:
    //   project_members.user_id = 5
    //   → find users row where users.id = 5
    //   → merge: gives us user name, email + joined_at
    getMembersByProject: async (projectId) => {
        const sql = `
            SELECT
                pm.id AS membership_id,
                pm.joined_at,
                u.id AS user_id,
                u.name,
                u.email,
                u.role
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?
            ORDER BY pm.joined_at ASC
        `;
        const [rows] = await db.execute(sql, [projectId]);
        return rows;
    },

    // ---- REMOVE MEMBER: Delete a specific membership ----
    // Deletes the row in project_members where BOTH
    // project_id AND user_id match. This is precise —
    // it only removes THIS user from THIS project.
    removeMember: async (projectId, userId) => {
        const sql = `
            DELETE FROM project_members
            WHERE project_id = ? AND user_id = ?
        `;
        const [result] = await db.execute(sql, [projectId, userId]);
        return result;
        // result.affectedRows = 1 if removed, 0 if not found
    },

    // ---- COUNT members of a project ----
    // Quick count used to display "X members" on the UI.
    countMembers: async (projectId) => {
        const sql = `
            SELECT COUNT(*) AS total
            FROM project_members
            WHERE project_id = ?
        `;
        const [rows] = await db.execute(sql, [projectId]);
        return rows[0].total;
    }
};

module.exports = ProjectMember;
