// =============================================
// project-detail.js — Project Detail Page Logic
// =============================================
// This page shows all the details of ONE specific project.
//
// HOW DOES IT KNOW WHICH PROJECT TO SHOW?
// → The URL contains a query parameter: ?id=5
//   Example: /project-detail.html?id=5
//   We read that "5" and call: GET /api/projects/5
//
// This page also lets the user:
//   - Edit the project (opens an edit modal)
//   - Delete the project (opens a confirm modal, then redirects)
// =============================================

const API_BASE = 'http://localhost:5000/api';
const token = localStorage.getItem('taskflow_token');

// Auth guard: redirect to login if not authenticated
if (!token) {
    window.location.href = 'login.html';
}

// ---- Read the Project ID from the URL ----
// URL: project-detail.html?id=42
// URLSearchParams lets us read "?id=42" → gets "42"
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

// If no ID in URL, redirect back to projects
if (!projectId) {
    window.location.href = 'projects.html';
}

// ---- Current project data (used when editing) ----
let currentProject = null;

// =============================================
// PARTICLE BACKGROUND
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
        container.appendChild(p);
    }
}
createParticles();

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    toast.className = `toast toast-${type} show`;
    toastIcon.textContent = type === 'success' ? '✅' : '❌';
    toastMsg.textContent = message;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// =============================================
// FORMAT DATE & TIME
// =============================================
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// =============================================
// HTML ESCAPE (security)
// =============================================
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// =============================================
// LOAD USER INFO (Navbar)
// =============================================
async function loadUserInfo() {
    try {
        const res = await fetch(`${API_BASE}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            localStorage.removeItem('taskflow_token');
            window.location.href = 'login.html';
            return;
        }
        const data = await res.json();
        const user = data.data;
        document.getElementById('navAvatar').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('navUserName').textContent = user.name;
    } catch (err) {
        console.error(err);
    }
}

// =============================================
// LOAD PROJECT DETAILS
// =============================================
// Calls: GET /api/projects/:id
// The backend returns the project data + creator info
async function loadProjectDetails() {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
                // Required! The backend 'protect' middleware
                // verifies this token before proceeding
            }
        });

        const data = await response.json();

        // Hide skeleton loader
        document.getElementById('detailSkeleton').style.display = 'none';

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('taskflow_token');
                window.location.href = 'login.html';
                return;
            }
            // Project not found → show not found state
            document.getElementById('notFoundState').style.display = 'block';
            return;
        }

        const project = data.data;
        currentProject = project; // Save for edit form

        // Update page title
        document.title = `${project.name} | TaskFlow`;

        // ---- Fill in all the page details ----
        document.getElementById('projectIdBadge').textContent = `#${project.id}`;
        document.getElementById('detailName').textContent = project.name;
        document.getElementById('detailCreator').textContent = project.creator_name;
        document.getElementById('detailDate').textContent = formatDate(project.created_at);

        // Description (show italic placeholder if empty)
        const descEl = document.getElementById('detailDescription');
        if (project.description && project.description.trim() !== '') {
            descEl.textContent = project.description;
        } else {
            descEl.innerHTML = '<em style="color: var(--text-muted);">No description provided.</em>';
        }

        // Creator section
        const creatorInitial = project.creator_name.charAt(0).toUpperCase();
        document.getElementById('creatorAvatar').textContent = creatorInitial;
        document.getElementById('creatorName').textContent = project.creator_name;
        document.getElementById('creatorEmail').textContent = project.creator_email;

        // Timeline
        document.getElementById('timelineCreated').textContent = formatDateTime(project.created_at);

        // Show the content
        document.getElementById('detailContent').style.display = 'block';

        // Wire up the Kanban Board button with the project ID
        // This sets href="kanban.html?id=5" so it navigates correctly
        const kanbanBtn = document.getElementById('openKanbanBtn');
        if (kanbanBtn) {
            kanbanBtn.href = `kanban.html?id=${project.id}`;
        }

    } catch (error) {
        console.error('❌ loadProjectDetails error:', error);
        document.getElementById('detailSkeleton').style.display = 'none';
        document.getElementById('notFoundState').style.display = 'block';
    }
}

// =============================================
// EDIT MODAL — Open & Pre-fill
// =============================================
document.getElementById('editProjectBtn').addEventListener('click', () => {
    if (!currentProject) return;

    // Pre-fill the edit form with current values
    document.getElementById('editingProjectId').value = currentProject.id;
    document.getElementById('editProjectName').value = currentProject.name;
    document.getElementById('editProjectDescription').value = currentProject.description || '';

    // Clear any previous errors
    const alert = document.getElementById('editModalAlert');
    alert.classList.remove('show');

    document.getElementById('editModal').classList.add('open');
    document.getElementById('editProjectName').focus();
});

// =============================================
// EDIT FORM SUBMIT
// =============================================
// Sends: PUT /api/projects/:id
// Body: { name, description }
document.getElementById('editProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editingProjectId').value;
    const name = document.getElementById('editProjectName').value.trim();
    const description = document.getElementById('editProjectDescription').value.trim();

    if (!name) {
        const alertEl = document.getElementById('editModalAlert');
        document.getElementById('editModalAlertText').textContent = 'Project name is required.';
        alertEl.classList.add('show');
        return;
    }

    const saveBtn = document.getElementById('saveEditBtn');
    saveBtn.classList.add('btn-loading');

    try {
        const response = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById('editModalAlertText').textContent = data.message || 'Failed to update.';
            document.getElementById('editModalAlert').classList.add('show');
            return;
        }

        // Success — update the page without full reload
        currentProject = data.data;
        document.getElementById('detailName').textContent = data.data.name;
        document.title = `${data.data.name} | TaskFlow`;

        const descEl = document.getElementById('detailDescription');
        if (data.data.description && data.data.description.trim() !== '') {
            descEl.textContent = data.data.description;
        } else {
            descEl.innerHTML = '<em style="color: var(--text-muted);">No description provided.</em>';
        }

        closeEditModal();
        showToast('Project updated successfully! ✨');

    } catch (error) {
        document.getElementById('editModalAlertText').textContent = 'Network error. Try again.';
        document.getElementById('editModalAlert').classList.add('show');
    } finally {
        saveBtn.classList.remove('btn-loading');
    }
});

// =============================================
// DELETE — Open Confirm Modal
// =============================================
document.getElementById('deleteProjectBtn').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.add('open');
});

// =============================================
// DELETE — Confirm
// =============================================
// Sends: DELETE /api/projects/:id
// On success, redirects back to the projects list
document.getElementById('confirmDeleteDetail').addEventListener('click', async () => {
    const btn = document.getElementById('confirmDeleteDetail');
    btn.classList.add('btn-loading');

    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.message || 'Failed to delete.', 'error');
            closeDeleteModal();
            return;
        }

        // Project deleted — redirect to projects page
        showToast('Project deleted!');
        setTimeout(() => {
            window.location.href = 'projects.html';
        }, 1000);

    } catch (error) {
        showToast('Network error. Try again.', 'error');
        closeDeleteModal();
    } finally {
        btn.classList.remove('btn-loading');
    }
});

// =============================================
// CLOSE MODALS
// =============================================
function closeEditModal() {
    document.getElementById('editModal').classList.remove('open');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('open');
}

document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEditModal').addEventListener('click', closeEditModal);
document.getElementById('cancelDeleteDetail').addEventListener('click', closeDeleteModal);

document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModal')) closeEditModal();
});

document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditModal();
        closeDeleteModal();
    }
});

// =============================================
// LOGOUT
// =============================================
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('taskflow_token');
    window.location.href = 'login.html';
});

// =============================================
// INITIALIZE
// =============================================
loadUserInfo();
loadProjectDetails();

// =============================================
// =============================================
// PHASE 3 — TEAM MEMBERS
// =============================================
// =============================================

// Track which member is being removed
let memberToRemove = null;

// =============================================
// LOAD MEMBERS FROM API
// =============================================
// Calls: GET /api/projects/:id/members
// The backend runs a JOIN between project_members
// and users tables, returning full member details.
async function loadMembers() {
    try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        // Clear skeleton loaders
        const list = document.getElementById('membersList');
        list.innerHTML = '';

        if (!res.ok) {
            console.error('Failed to load members:', data.message);
            return;
        }

        const members = data.data;

        // Update the count badge
        document.getElementById('memberCountBadge').textContent = members.length;

        if (members.length === 0) {
            // Show empty state
            document.getElementById('membersEmpty').style.display = 'flex';
            return;
        }

        document.getElementById('membersEmpty').style.display = 'none';

        // Render each member as a row
        members.forEach((member, index) => {
            renderMemberRow(member, index);
        });

    } catch (err) {
        console.error('❌ loadMembers error:', err);
        document.getElementById('membersList').innerHTML = '';
    }
}

// =============================================
// RENDER A SINGLE MEMBER ROW
// =============================================
// Builds one member row HTML and appends it to the list.
// Each row shows: avatar, name, email, role, joined date, remove btn.
function renderMemberRow(member, index) {
    const list = document.getElementById('membersList');
    const colorClass = `avatar-color-${index % 8}`;

    const row = document.createElement('div');
    row.className = 'member-row';
    row.id = `memberRow${member.user_id}`;
    row.style.animationDelay = `${index * 0.05}s`;

    const joinedDate = new Date(member.joined_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    row.innerHTML = `
        <!-- Coloured Avatar Circle -->
        <div class="member-avatar ${colorClass}">
            ${escapeHTML(member.name.charAt(0).toUpperCase())}
        </div>

        <!-- Name & Email -->
        <div class="member-info">
            <span class="member-name">${escapeHTML(member.name)}</span>
            <span class="member-email">${escapeHTML(member.email)}</span>
        </div>

        <!-- Role badge -->
        <span class="member-role-badge">${escapeHTML(member.role)}</span>

        <!-- Joined Date -->
        <span class="member-joined">Joined ${joinedDate}</span>

        <!-- Remove Button (visible on hover) -->
        <button
            class="btn-remove-member"
            title="Remove ${escapeHTML(member.name)} from project"
            onclick="promptRemoveMember(${member.user_id}, '${escapeHTML(member.name)}')"
            id="removeBtn${member.user_id}"
        >
            <svg viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;

    list.appendChild(row);
}

// =============================================
// ADD MEMBER MODAL — Open/Close
// =============================================
function openAddMemberModal() {
    document.getElementById('addMemberForm').reset();
    document.getElementById('addMemberAlert').classList.remove('show');
    document.getElementById('addMemberModal').classList.add('open');
    document.getElementById('memberEmail').focus();
}

function closeAddMemberModal() {
    document.getElementById('addMemberModal').classList.remove('open');
}

document.getElementById('openAddMemberModal').addEventListener('click', openAddMemberModal);
document.getElementById('closeAddMemberModal').addEventListener('click', closeAddMemberModal);
document.getElementById('cancelAddMember').addEventListener('click', closeAddMemberModal);

document.getElementById('addMemberModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('addMemberModal')) closeAddMemberModal();
});

// =============================================
// ADD MEMBER FORM SUBMIT
// =============================================
// Sends: POST /api/projects/:id/members
// Body: { email: "alice@example.com" }
//
// The backend:
//   1. Looks up the user by email in the users table
//   2. Checks they're not already a member
//   3. Inserts a row into the project_members junction table
document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('memberEmail').value.trim();
    if (!email) return;

    const submitBtn = document.getElementById('submitAddMember');
    submitBtn.classList.add('btn-loading');
    document.getElementById('addMemberAlert').classList.remove('show');

    try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (!res.ok) {
            // Show the error inside the modal
            document.getElementById('addMemberAlertText').textContent = data.message;
            document.getElementById('addMemberAlert').classList.add('show');
            return;
        }

        // Success — close modal, reload member list, show toast
        closeAddMemberModal();
        showToast(`${data.data.name} added to the project! 🎉`);
        await loadMembers();

    } catch (err) {
        document.getElementById('addMemberAlertText').textContent = 'Network error. Try again.';
        document.getElementById('addMemberAlert').classList.add('show');
    } finally {
        submitBtn.classList.remove('btn-loading');
    }
});

// =============================================
// REMOVE MEMBER — Open Confirm Modal
// =============================================
// Called by the remove button's onclick on each member row.
function promptRemoveMember(userId, name) {
    memberToRemove = { userId, name };
    document.getElementById('removeMemberName').textContent = `"${name}"`;
    document.getElementById('removeMemberModal').classList.add('open');
}

function closeRemoveMemberModal() {
    document.getElementById('removeMemberModal').classList.remove('open');
    memberToRemove = null;
}

document.getElementById('cancelRemoveMember').addEventListener('click', closeRemoveMemberModal);

document.getElementById('removeMemberModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('removeMemberModal')) closeRemoveMemberModal();
});

// =============================================
// REMOVE MEMBER — Confirm & Execute
// =============================================
// Sends: DELETE /api/projects/:id/members/:userId
//
// The backend finds the row in project_members where
// BOTH project_id AND user_id match, then deletes it.
document.getElementById('confirmRemoveMember').addEventListener('click', async () => {
    if (!memberToRemove) return;

    const btn = document.getElementById('confirmRemoveMember');
    btn.classList.add('btn-loading');

    try {
        const res = await fetch(
            `${API_BASE}/projects/${projectId}/members/${memberToRemove.userId}`,
            {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        const data = await res.json();

        if (!res.ok) {
            showToast(data.message || 'Failed to remove member.', 'error');
            closeRemoveMemberModal();
            return;
        }

        // Remove the row from the DOM immediately (no full reload needed)
        const row = document.getElementById(`memberRow${memberToRemove.userId}`);
        if (row) {
            row.style.animation = 'none';
            row.style.opacity = '0';
            row.style.transform = 'translateX(-10px)';
            row.style.transition = 'all 0.25s ease';
            setTimeout(() => row.remove(), 250);
        }

        closeRemoveMemberModal();
        showToast(`${memberToRemove.name} removed from the project.`);

        // Reload to update count badge accurately
        setTimeout(loadMembers, 300);

    } catch (err) {
        showToast('Network error. Try again.', 'error');
        closeRemoveMemberModal();
    } finally {
        btn.classList.remove('btn-loading');
    }
});

// Close all modals on Escape — extend existing keydown listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAddMemberModal();
        closeRemoveMemberModal();
    }
});

// Load members once the page is ready
// (called after loadProjectDetails completes)
loadMembers();

