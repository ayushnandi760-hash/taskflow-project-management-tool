-- =============================================
-- TaskFlow Database Schema - Phase 1 + Phase 2
-- =============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS taskflow;

-- Use the database
USE taskflow;

-- =============================================
-- Users Table (Phase 1)
-- =============================================
-- This table stores all registered users.
-- Passwords are stored as bcrypt hashes (never plain text).
-- The 'role' column allows us to differentiate between
-- regular users and admins in future phases.

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Projects Table (Phase 2)
-- =============================================
-- This table stores all projects created by users.
--
-- RELATIONSHIP: projects.created_by → users.id
-- This is a FOREIGN KEY — it links each project to
-- the user who created it. This is called a
-- "One-to-Many" relationship:
--   ✅ One user can create MANY projects
--   ✅ But each project belongs to only ONE user
--
-- ON DELETE CASCADE means: if the user is deleted,
-- all their projects are automatically deleted too.

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraint
    CONSTRAINT fk_project_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =============================================
-- Project Members Table (Phase 3)
-- =============================================
-- This is a JUNCTION TABLE (also called a "bridge table"
-- or "linking table"). It solves the Many-to-Many problem.
--
-- PROBLEM: How do we store that:
--   - Alice is a member of Project A AND Project B
--   - Project A has Alice AND Bob AND Carol as members
--
-- WRONG approach: You CANNOT add a 'members' column to
-- the projects table (you can't store multiple user IDs
-- in one cell cleanly).
--
-- CORRECT approach: Create a separate table where each
-- row represents ONE membership connection:
--   project_id=1, user_id=2  → User 2 is in Project 1
--   project_id=1, user_id=3  → User 3 is in Project 1
--   project_id=2, user_id=2  → User 2 is ALSO in Project 2
--
-- RELATIONSHIPS:
--   project_members.project_id → projects.id  (FK)
--   project_members.user_id    → users.id     (FK)
--
-- UNIQUE constraint: prevents the same user being added
-- to the same project twice (a duplicate membership).

CREATE TABLE IF NOT EXISTS project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Each (project_id, user_id) pair must be unique
    -- This prevents duplicate memberships
    UNIQUE KEY unique_membership (project_id, user_id),

    -- Foreign Keys
    CONSTRAINT fk_member_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_member_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
