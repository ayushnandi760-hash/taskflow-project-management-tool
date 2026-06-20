// =============================================
// Project Controller
// =============================================
// Controllers are the "business logic" layer.
// They sit between the Route (URL handler) and the
// Model (database). Their job:
//   1. Read the request (req.body, req.params)
//   2. Call the Model to talk to the database
//   3. Send back the response (res.json)
//
// Each function here handles ONE API endpoint.
// =============================================

const Project = require('../models/projectModel');

// =============================================
// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (requires JWT token)
// =============================================
// Flow:
//   1. User fills "Create Project" form
//   2. Frontend sends: { name, description }
//   3. JWT middleware adds req.user (logged-in user)
//   4. We insert the project into the database
//   5. Return the new project's ID with a success message
const createProject = async (req, res) => {
    try {
        // --- Step 1: Get data from the request ---
        const { name, description } = req.body;

        // --- Step 2: Validate — name is required ---
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        // --- Step 3: Get the logged-in user's ID ---
        // req.user is attached by the 'protect' middleware
        // It contains the user's data from the database
        const userId = req.user.id;

        // --- Step 4: Save to database ---
        const result = await Project.create(name.trim(), description || '', userId);

        // --- Step 5: Return success response ---
        res.status(201).json({
            success: true,
            message: 'Project created successfully!',
            data: {
                projectId: result.insertId,
                name: name.trim(),
                description: description || ''
            }
        });

    } catch (error) {
        console.error('❌ createProject error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while creating project'
        });
    }
};

// =============================================
// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (requires JWT token)
// =============================================
// Flow:
//   1. Frontend makes GET request with JWT token
//   2. We fetch all projects from the database
//   3. The SQL JOIN also pulls in the creator's name
//   4. Return the full list as JSON
const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.findAll();

        res.status(200).json({
            success: true,
            count: projects.length,    // Total number of projects
            data: projects
        });

    } catch (error) {
        console.error('❌ getAllProjects error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching projects'
        });
    }
};

// =============================================
// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private (requires JWT token)
// =============================================
// ':id' is a URL parameter — the actual number comes
// from the URL, e.g., /api/projects/42 → req.params.id = "42"
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the project (and creator info via JOIN)
        const project = await Project.findById(id);

        // If no project was found, return a 404
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });

    } catch (error) {
        console.error('❌ getProjectById error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching project'
        });
    }
};

// =============================================
// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (requires JWT token)
// =============================================
// Flow:
//   1. User edits the project form and submits
//   2. Frontend sends: { name, description } to PUT /api/projects/42
//   3. We verify the project exists
//   4. We update it in the database
//   5. Return the updated project details
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // --- Validate name ---
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        // --- Check if the project exists ---
        const existing = await Project.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // --- Perform the update ---
        await Project.update(id, name.trim(), description || '');

        // --- Fetch the updated project to return fresh data ---
        const updated = await Project.findById(id);

        res.status(200).json({
            success: true,
            message: 'Project updated successfully!',
            data: updated
        });

    } catch (error) {
        console.error('❌ updateProject error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while updating project'
        });
    }
};

// =============================================
// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (requires JWT token)
// =============================================
// Flow:
//   1. User clicks "Delete" button on the project
//   2. Frontend sends: DELETE /api/projects/42
//   3. We check the project exists
//   4. We delete it from the database
//   5. Return a success confirmation
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        // --- Check if the project exists ---
        const existing = await Project.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // --- Delete from database ---
        await Project.delete(id);

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully!'
        });

    } catch (error) {
        console.error('❌ deleteProject error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting project'
        });
    }
};

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
};
