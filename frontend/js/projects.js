// =============================================
// projects.js — Projects Listing Page Logic
// =============================================
// This file handles ALL client-side logic for the
// projects listing page. It:
//   1. Checks if the user is logged in (has a JWT token)
//   2. Loads all projects from the backend API
//   3. Renders project cards dynamically
//   4. Handles Create, Edit, Delete via modals
//
// IMPORTANT: Every API request sends the JWT token
// in the Authorization header. Without it, the
// backend returns a 401 "Unauthorized" error.
// =============================================

// ---- API Base URL ----
// All our backend requests go to this address.
// Change this if your backend runs on a different port.
const API_BASE = 'http://localhost:5000/api';

// ---- JWT Token ----
// Stored in localStorage during login.
// We include it in every request to prove identity.
const token = localStorage.getItem('taskflow_token');

// ---- State ----
// We store the project currently being deleted so we
// can reference it when the user confirms deletion.
let projectToDelete = null;

// =============================================
// 1. AUTH GUARD
// =============================================
// If there's no token, the user is NOT logged in.
// Redirect them to the login page immediately.
if (!token) {
    window.location.href = 'login.html';
}

// =============================================
// 2. DOM REFERENCES
// =============================================
const projectsGrid     = document.getElementById('projectsGrid');
const emptyState       = document.getElementById('emptyState');
const totalCount       = document.getElementById('totalCount');

// Create/Edit Modal
const projectModal     = document.getElementById('projectModal');
const projectForm      = document.getElementById('projectForm');
const modalTitle       = document.getElementById('modalTitle');
const submitText       = document.getElementById('submitText');
const projectName      = document.getElementById('projectName');
const projectDesc      = document.getElementById('projectDescription');
const editProjectId    = document.getElementById('editProjectId');
const modalAlert       = document.getElementById('modalAlert');
const modalAlertText   = document.getElementById('modalAlertText');
const nameCharCount    = document.getElementById('nameCharCount');
const descCharCount    = document.getElementById('descCharCount');

// Delete Modal
const deleteModal      = document.getElementById('deleteModal');
const deleteProjectName = document.getElementById('deleteProjectName');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// =============================================
// 3. PARTICLE BACKGROUND
// =============================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 15 + 12) + 's';
        p.style.animationDelay = (Math.random() * 10) + 's';
        p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
        container.appendChild(p);
    }
}
createParticles();

// =============================================
// 4. TOAST NOTIFICATIONS
// =============================================
// A "toast" is a small popup message that appears
// briefly to confirm an action (like "Project created!").
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toast.className = `toast toast-${type} show`;
    toastIcon.textContent = type === 'success' ? '✅' : '❌';
    toastMsg.textContent = message;

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// =============================================
// 5. LOAD USER INFO IN NAVBAR
// =============================================
async function loadUserInfo() {
    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            // Token is invalid or expired → logout
            localStorage.removeItem('taskflow_token');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();
        const user = data.data;

        // Display first letter of name in avatar circle
        document.getElementById('navAvatar').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('navUserName').textContent = user.name;

    } catch (error) {
        console.error('Failed to load user info:', error);
    }
}

// =============================================
// 6. FORMAT DATE
// =============================================
// Takes a raw timestamp like "2025-06-17T10:30:00Z"
// and turns it into a readable format like "Jun 17, 2025"
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// =============================================
// 7. RENDER PROJECT CARDS
// =============================================
// Takes the array of projects from the API and
// creates HTML cards for each one.
function renderProjects(projects) {
    // Remove skeleton loading placeholders
    const skeletons = projectsGrid.querySelectorAll('.project-skeleton');
    skeletons.forEach(s => s.remove());

    if (projects.length === 0) {
        // Show empty state if no projects exist
        emptyState.style.display = 'block';
        totalCount.textContent = '0';
        return;
    }

    emptyState.style.display = 'none';
    totalCount.textContent = projects.length;

    // Build one card for each project
    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.animationDelay = `${index * 0.06}s`;

        const descriptionHTML = project.description
            ? `<p class="card-description">${escapeHTML(project.description)}</p>`
            : `<p class="card-description" style="color: var(--text-muted); font-style: italic;">No description provided.</p>`;

        const creatorInitial = project.creator_name
            ? project.creator_name.charAt(0).toUpperCase()
            : 'U';

        card.innerHTML = `
            <div class="project-card-accent"></div>

            <!-- Card Top Row: ID badge + action buttons -->
            <div class="card-header-row">
                <span class="card-id-badge">#${project.id}</span>
                <div class="card-actions">
                    <button
                        class="card-action-btn edit"
                        title="Edit project"
                        onclick="openEditModal(event, ${project.id}, '${escapeAttr(project.name)}', '${escapeAttr(project.description || '')}')"
                        id="editBtn${project.id}"
                    >
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                        class="card-action-btn delete"
                        title="Delete project"
                        onclick="openDeleteModal(event, ${project.id}, '${escapeAttr(project.name)}')"
                        id="deleteBtn${project.id}"
                    >
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                </div>
            </div>

            <!-- Card Body: Clickable area → goes to detail page -->
            <a class="card-body" href="project-detail.html?id=${project.id}">
                <h2 class="card-title">${escapeHTML(project.name)}</h2>
                ${descriptionHTML}
            </a>

            <!-- Card Footer: Creator info + date -->
            <div class="card-footer">
                <div class="card-creator-avatar">${creatorInitial}</div>
                <span class="card-creator-name">${escapeHTML(project.creator_name)}</span>
                <span class="card-date">${formatDate(project.created_at)}</span>
            </div>
        `;

        projectsGrid.appendChild(card);
    });
}

// =============================================
// 8. FETCH ALL PROJECTS FROM THE API
// =============================================
// This is the main function that loads all projects.
// It calls: GET /api/projects
// The backend returns a JSON array of projects.
async function loadProjects() {
    try {
        // Make the API request with the JWT token
        const response = await fetch(`${API_BASE}/projects`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
                // The backend's 'protect' middleware reads this header
                // and verifies the JWT before running the controller
            }
        });

        const data = await response.json();

        if (!response.ok) {
            // Token expired → force logout
            if (response.status === 401) {
                localStorage.removeItem('taskflow_token');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(data.message || 'Failed to load projects');
        }

        // Render the projects on the page
        renderProjects(data.data);

    } catch (error) {
        console.error('❌ loadProjects error:', error);
        // Remove skeletons and show a simple error
        const skeletons = projectsGrid.querySelectorAll('.project-skeleton');
        skeletons.forEach(s => s.remove());
        showToast('Failed to load projects. Please refresh.', 'error');
    }
}

// =============================================
// 9. OPEN CREATE MODAL
// =============================================
function openCreateModal() {
    // Reset the form to blank
    projectForm.reset();
    editProjectId.value = '';
    modalTitle.textContent = 'Create New Project';
    submitText.textContent = 'Create Project';
    nameCharCount.textContent = '0';
    descCharCount.textContent = '0';
    hideModalAlert();

    // Open the modal
    projectModal.classList.add('open');
    projectName.focus();
}

// =============================================
// 10. OPEN EDIT MODAL (from card)
// =============================================
// Called when the user clicks the ✏️ edit button on a card.
// We pre-fill the form with the project's current data.
function openEditModal(event, id, name, description) {
    event.preventDefault();    // Don't follow the card's link
    event.stopPropagation();   // Don't bubble up to parent

    // Pre-fill the form with existing values
    editProjectId.value = id;
    projectName.value = name;
    projectDesc.value = description;
    nameCharCount.textContent = name.length;
    descCharCount.textContent = description.length;

    // Change modal title to indicate "edit mode"
    modalTitle.textContent = 'Edit Project';
    submitText.textContent = 'Save Changes';
    hideModalAlert();

    projectModal.classList.add('open');
    projectName.focus();
}

// =============================================
// 11. OPEN DELETE MODAL (from card)
// =============================================
function openDeleteModal(event, id, name) {
    event.preventDefault();
    event.stopPropagation();

    // Store which project we're deleting
    projectToDelete = { id, name };

    // Show the project name in the confirmation dialog
    deleteProjectName.textContent = `"${name}"`;

    deleteModal.classList.add('open');
}

// =============================================
// 12. CLOSE MODALS
// =============================================
function closeProjectModal() {
    projectModal.classList.remove('open');
}

function closeDeleteModal() {
    deleteModal.classList.remove('open');
    projectToDelete = null;
}

// =============================================
// 13. HANDLE FORM SUBMIT (Create OR Edit)
// =============================================
// This single function handles BOTH creating and editing.
// How do we know which? We check if editProjectId.value
// is empty (create) or has a number (edit).
projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = projectName.value.trim();
    const description = projectDesc.value.trim();
    const id = editProjectId.value;

    if (!name) {
        showModalAlert('Project name is required.');
        return;
    }

    // Show loading spinner
    const submitBtn = document.getElementById('submitModal');
    submitBtn.classList.add('btn-loading');

    try {
        let response;

        if (!id) {
            // ---- CREATE: POST /api/projects ----
            response = await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, description })
            });
        } else {
            // ---- EDIT: PUT /api/projects/:id ----
            response = await fetch(`${API_BASE}/projects/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, description })
            });
        }

        const data = await response.json();

        if (!response.ok) {
            showModalAlert(data.message || 'Something went wrong.');
            return;
        }

        // Success! Close modal, refresh project list, show toast
        closeProjectModal();
        const action = !id ? 'created' : 'updated';
        showToast(`Project ${action} successfully! 🎉`);

        // Reload the projects grid
        projectsGrid.innerHTML = `
            <div class="project-skeleton" id="skeleton1"></div>
            <div class="project-skeleton" id="skeleton2"></div>
            <div class="project-skeleton" id="skeleton3"></div>
        `;
        await loadProjects();

    } catch (error) {
        showModalAlert('Network error. Please try again.');
    } finally {
        submitBtn.classList.remove('btn-loading');
    }
});

// =============================================
// 14. HANDLE DELETE CONFIRMATION
// =============================================
// Called when the user clicks "Delete" in the confirmation modal.
// Sends: DELETE /api/projects/:id
confirmDeleteBtn.addEventListener('click', async () => {
    if (!projectToDelete) return;

    confirmDeleteBtn.classList.add('btn-loading');

    try {
        const response = await fetch(`${API_BASE}/projects/${projectToDelete.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || 'Failed to delete project.', 'error');
            closeDeleteModal();
            return;
        }

        closeDeleteModal();
        showToast('Project deleted successfully!');

        // Reload the projects grid
        projectsGrid.innerHTML = `
            <div class="project-skeleton" id="skeleton1"></div>
            <div class="project-skeleton" id="skeleton2"></div>
            <div class="project-skeleton" id="skeleton3"></div>
        `;
        await loadProjects();

    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        closeDeleteModal();
    } finally {
        confirmDeleteBtn.classList.remove('btn-loading');
    }
});

// =============================================
// 15. MODAL ALERT HELPERS
// =============================================
function showModalAlert(message) {
    modalAlertText.textContent = message;
    modalAlert.classList.add('show');
}

function hideModalAlert() {
    modalAlert.classList.remove('show');
    modalAlertText.textContent = '';
}

// =============================================
// 16. CHARACTER COUNTERS
// =============================================
projectName.addEventListener('input', () => {
    nameCharCount.textContent = projectName.value.length;
});

projectDesc.addEventListener('input', () => {
    descCharCount.textContent = projectDesc.value.length;
});

// =============================================
// 17. MODAL EVENT LISTENERS
// =============================================
document.getElementById('openCreateModal').addEventListener('click', openCreateModal);
document.getElementById('emptyCreateBtn').addEventListener('click', openCreateModal);
document.getElementById('closeModal').addEventListener('click', closeProjectModal);
document.getElementById('cancelModal').addEventListener('click', closeProjectModal);
document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);

// Close modal when clicking outside of it
projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) closeProjectModal();
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProjectModal();
        closeDeleteModal();
    }
});

// =============================================
// 18. LOGOUT
// =============================================
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('taskflow_token');
    window.location.href = 'login.html';
});

// =============================================
// 19. HTML ESCAPE HELPERS
// =============================================
// IMPORTANT: Always escape user-provided data before
// inserting it into HTML to prevent XSS attacks.
// XSS = Cross-Site Scripting (a security vulnerability)
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// For HTML attribute values (onclick, etc.)
function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

// =============================================
// 20. INITIALIZE
// =============================================
// Run these functions when the page first loads
loadUserInfo();
loadProjects();
