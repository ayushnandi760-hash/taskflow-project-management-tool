// =============================================
// Project Member Controller
// =============================================
// Handles all business logic for project membership:
//   - Adding a user to a project (by email)
//   - Getting all members of a project
//   - Removing a user from a project
//
// All routes require a valid JWT token (protect middleware).
// The logged-in user's data is available via req.user.
// =============================================

const ProjectMember = require('../models/projectMemberModel');
const Project = require('../models/projectModel');
const User = require('../models/userModel');

// =============================================
// @desc    Add a member to a project
// @route   POST /api/projects/:id/members
// @access  Private (JWT required)
// =============================================
// HOW IT WORKS:
//   1. Frontend sends the email of the user to add
//   2. We look up that email in the users table
//   3. We check if they're already a member
//   4. If not, we insert a row in project_members
//
// Why do we look up by EMAIL instead of by ID?
// → It's more user-friendly. You type "alice@email.com"
//   instead of needing to know Alice's user ID number.
const addMember = async (req, res) => {
    try {
        const projectId = req.params.id;     // From URL: /api/projects/5/members
        const { email } = req.body;          // From request body: { "email": "alice@..." }

        // --- Step 1: Validate input ---
        if (!email || email.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide the email of the user to add'
            });
        }

        // --- Step 2: Check if the project exists ---
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // --- Step 3: Look up the user by email ---
        // We need their ID to insert into project_members
        const userToAdd = await User.findByEmail(email.trim().toLowerCase());
        if (!userToAdd) {
            return res.status(404).json({
                success: false,
                message: 'No user found with that email address'
            });
        }

        // --- Step 4: Prevent adding yourself ---
        if (userToAdd.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You are already the project creator — no need to add yourself'
            });
        }

        // --- Step 5: Check if already a member ---
        // The junction table has a UNIQUE constraint on (project_id, user_id),
        // so we check first and return a friendly error.
        const alreadyMember = await ProjectMember.isMember(projectId, userToAdd.id);
        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: `${userToAdd.name} is already a member of this project`
            });
        }

        // --- Step 6: Insert the membership into the junction table ---
        // This creates: { project_id: 5, user_id: 8 }
        await ProjectMember.addMember(projectId, userToAdd.id);

        res.status(201).json({
            success: true,
            message: `${userToAdd.name} has been added to the project!`,
            data: {
                userId: userToAdd.id,
                name: userToAdd.name,
                email: userToAdd.email
            }
        });

    } catch (error) {
        console.error('❌ addMember error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while adding member'
        });
    }
};

// =============================================
// @desc    Get all members of a project
// @route   GET /api/projects/:id/members
// @access  Private (JWT required)
// =============================================
// HOW IT WORKS:
//   1. Read the project ID from the URL
//   2. Query project_members JOIN users to get full member info
//   3. Return the array of members as JSON
const getMembers = async (req, res) => {
    try {
        const projectId = req.params.id;

        // --- Check project exists ---
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // --- Fetch all members with their user details ---
        // The model runs: SELECT ... FROM project_members JOIN users ...
        const members = await ProjectMember.getMembersByProject(projectId);

        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });

    } catch (error) {
        console.error('❌ getMembers error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching members'
        });
    }
};

// =============================================
// @desc    Remove a member from a project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (JWT required)
// =============================================
// HOW IT WORKS:
//   1. Read projectId from :id and userId from :userId in the URL
//   2. Check the project and membership exist
//   3. Delete that specific row from project_members
//
// URL example: DELETE /api/projects/5/members/8
//   → Remove user #8 from project #5
const removeMember = async (req, res) => {
    try {
        const { id: projectId, userId } = req.params;
        // Destructuring: id from URL becomes projectId, userId is userId

        // --- Check project exists ---
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // --- Check the membership actually exists ---
        const isMember = await ProjectMember.isMember(projectId, userId);
        if (!isMember) {
            return res.status(404).json({
                success: false,
                message: 'This user is not a member of the project'
            });
        }

        // --- Delete from junction table ---
        // Only deletes the row where BOTH project_id AND user_id match
        await ProjectMember.removeMember(projectId, userId);

        res.status(200).json({
            success: true,
            message: 'Member removed from project successfully'
        });

    } catch (error) {
        console.error('❌ removeMember error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while removing member'
        });
    }
};

module.exports = { addMember, getMembers, removeMember };
