// =============================================
// tasks.js — Phase 4: Task Management
// =============================================
// This file handles everything related to tasks
// on the Project Detail page.
//
// It talks to these API endpoints:
//   POST   /api/tasks              → create a task
//   GET    /api/tasks?project_id=  → list tasks
//   PUT    /api/tasks/:id          → edit a task
//   DELETE /api/tasks/:id          → delete a task
//
// HOW IT CONNECTS TO THE PAGE:
//   - project-detail.js already reads ?id= from the URL
//     and stores it in `projectId`. We reuse that here.
//   - We also reuse the `token` and `showToast()` function
//     defined in project-detail.js (loaded before this file).
// =============================================

// ---- State variables ----
let allTasks = [];          // Master list (never mutated by filters)
let taskToDelete = null;    // Stores { id, title } for the delete modal
let allMembers = [];        // Project members for the assignee dropdown

// =============================================
// UTILITY: Format a date string like "Jun 18, 2026"
// =============================================
function formatTaskDate(dateString) {
    if (!dateString) return null;
    // Dates from MySQL arrive as "2026-06-18T00:00:00.000Z"
    // We parse it carefully to avoid timezone shifts
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// =============================================
// UTILITY: Check if a date is in the past
// =============================================
function isOverdue(dateString) {
    if (!dateString) return false;
    const due = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
}

// =============================================
// UTILITY: Get CSS class name for status
// Maps "In Progress" → "in-progress" for CSS selectors
// =============================================
function statusClass(status) {
    return status.toLowerCase().replace(/\s+/g, '-');
}

// =============================================
// POPULATE ASSIGNEE DROPDOWNS
// =============================================
// Both the Create form and Edit modal need a list of
// project members to assign tasks to.
// This function fills both <select> elements from allMembers.
function populateAssigneeDropdowns() {
    const dropdowns = ['newTaskAssignee', 'editTaskAssignee'];

    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        // Clear all options except the first "— Unassigned —"
        select.innerHTML = '<option value="">— Unassigned —</option>';

        allMembers.forEach(member => {
            const opt = document.createElement('option');
            opt.value = member.user_id;
            opt.textContent = `${escapeHTML(member.name)} (${escapeHTML(member.email)})`;
            select.appendChild(opt);
        });
    });
}

// =============================================
// LOAD MEMBERS (for assignee dropdowns)
// =============================================
// We need the member list BEFORE the create/edit forms
// are opened, so we load them when the page initialises.
async function loadMembersForTasks() {
    try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            allMembers = data.data || [];
            populateAssigneeDropdowns();
        }
    } catch (err) {
        console.error('❌ loadMembersForTasks error:', err);
    }
}

// =============================================
// RENDER A SINGLE TASK CARD
// =============================================
// Builds one task card HTML element and returns it.
// The card includes:
//   - Coloured left accent based on priority
//   - Title (with strikethrough if completed)
//   - Priority badge, status dropdown, assignee chip, due date chip
//   - Edit + Delete buttons (appear on hover)
function renderTaskCard(task, index) {
    const card = document.createElement('div');
    const priorityLower = (task.priority || 'medium').toLowerCase();
    const isCompleted = task.status === 'Completed';
    card.className = `task-card priority-${priorityLower}${isCompleted ? ' completed' : ''}`;
    card.id = `taskCard${task.id}`;
    card.style.animationDelay = `${index * 0.04}s`;

    // --- Priority badge HTML ---
    const priorityBadge = `
        <span class="priority-badge ${priorityLower}">
            <span class="priority-dot"></span>
            ${escapeHTML(task.priority)}
        </span>
    `;

    // --- Status dropdown ---
    // The user can change status directly from the card
    // without opening the full edit modal.
    const statusCls = statusClass(task.status);
    const statusSelect = `
        <select
            class="status-select ${statusCls}"
            id="statusSelect${task.id}"
            aria-label="Change status"
            onchange="handleStatusChange(${task.id}, this)"
        >
            <option value="To Do"${task.status === 'To Do' ? ' selected' : ''}>📋 To Do</option>
            <option value="In Progress"${task.status === 'In Progress' ? ' selected' : ''}>⚡ In Progress</option>
            <option value="Completed"${task.status === 'Completed' ? ' selected' : ''}>✅ Completed</option>
        </select>
    `;

    // --- Assignee chip ---
    const assigneeChip = task.assignee_name ? `
        <span class="assignee-chip">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${escapeHTML(task.assignee_name)}
        </span>
    ` : '';

    // --- Due date chip ---
    let dueDateChip = '';
    if (task.due_date) {
        const overdue = isOverdue(task.due_date) && !isCompleted;
        dueDateChip = `
            <span class="due-date-chip${overdue ? ' overdue' : ''}">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${overdue ? '⚠️ ' : ''}${formatTaskDate(task.due_date)}
            </span>
        `;
    }

    card.innerHTML = `
        <div class="task-body">
            <div class="task-title">${escapeHTML(task.title)}</div>
            <div class="task-meta-row">
                ${priorityBadge}
                ${statusSelect}
                ${assigneeChip}
                ${dueDateChip}
            </div>
        </div>
        <div class="task-actions">
            <!-- Phase 6: Comments Button -->
            <button
                class="btn-task-action comments"
                title="View comments"
                onclick="openCommentsModal(${task.id}, '${escapeHTML(task.title).replace(/'/g, "&#39;")}')"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
            <button
                class="btn-task-action edit"
                title="Edit task"
                id="editTaskBtn${task.id}"
                onclick="openEditTaskModal(${task.id})"
            >
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
                class="btn-task-action delete"
                title="Delete task"
                id="deleteTaskBtn${task.id}"
                onclick="promptDeleteTask(${task.id}, '${escapeHTML(task.title).replace(/'/g, "&#39;")}')"
            >
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
        </div>
    `;

    return card;
}

// =============================================
// RENDER ALL TASKS (handles filter state)
// =============================================
// Reads the current active filter and re-renders
// only the matching tasks from the allTasks array.
function renderTasks(filter = 'all') {
    const list = document.getElementById('tasksList');
    const emptyState = document.getElementById('tasksEmpty');
    list.innerHTML = '';

    // Filter the master list
    const filtered = filter === 'all'
        ? allTasks
        : allTasks.filter(t => t.status === filter);

    // Update count badge with total (not filtered) count
    document.getElementById('taskCountBadge').textContent = allTasks.length;

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    filtered.forEach((task, i) => {
        list.appendChild(renderTaskCard(task, i));
    });
}

// =============================================
// LOAD TASKS FROM API
// =============================================
// Calls: GET /api/tasks?project_id=5
// Stores results in `allTasks`, then renders.
async function loadTasks() {
    // Show skeleton, hide list
    document.getElementById('taskSkeletons').style.display = 'block';
    document.getElementById('tasksList').innerHTML = '';
    document.getElementById('tasksEmpty').style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/tasks?project_id=${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // Hide skeleton
        document.getElementById('taskSkeletons').style.display = 'none';

        if (!res.ok) {
            console.error('Failed to load tasks:', data.message);
            return;
        }

        allTasks = data.data;

        // Get current active filter
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset?.filter || 'all';
        renderTasks(activeFilter);

    } catch (err) {
        console.error('❌ loadTasks error:', err);
        document.getElementById('taskSkeletons').style.display = 'none';
    }
}

// =============================================
// FILTER BUTTONS
// =============================================
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active class
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Re-render with new filter
        renderTasks(btn.dataset.filter);
    });
});

// =============================================
// CREATE TASK PANEL — Open / Close
// =============================================
const createPanel = document.getElementById('createTaskPanel');

document.getElementById('openCreateTaskPanel').addEventListener('click', () => {
    const isOpen = createPanel.classList.contains('open');
    if (isOpen) {
        createPanel.classList.remove('open');
    } else {
        // Reset the form before opening
        document.getElementById('createTaskForm').reset();
        document.getElementById('createTaskAlert').classList.remove('show');
        createPanel.classList.add('open');
        document.getElementById('newTaskTitle').focus();
    }
});

document.getElementById('cancelCreateTask').addEventListener('click', () => {
    createPanel.classList.remove('open');
});

// =============================================
// CREATE TASK — Form Submit
// =============================================
// Flow:
//   1. User fills the create form and clicks "Create Task"
//   2. We validate the title
//   3. We POST to /api/tasks
//   4. On success: close panel, refresh task list, show toast
document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('newTaskTitle').value.trim();
    const priority = document.getElementById('newTaskPriority').value;
    const status = document.getElementById('newTaskStatus').value;
    const dueDate = document.getElementById('newTaskDueDate').value;
    const assignedTo = document.getElementById('newTaskAssignee').value;
    const description = document.getElementById('newTaskDescription').value.trim();

    // --- Client-side validation ---
    if (!title) {
        showCreateAlert('Task title is required.');
        return;
    }

    const submitBtn = document.getElementById('submitCreateTask');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    document.getElementById('createTaskAlert').classList.remove('show');

    try {
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                project_id: projectId,
                title,
                description,
                priority,
                status,
                due_date: dueDate || null,
                assigned_to: assignedTo || null
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showCreateAlert(data.message || 'Failed to create task.');
            return;
        }

        // Success — close panel, refresh list, show toast
        createPanel.classList.remove('open');
        document.getElementById('createTaskForm').reset();
        showToast('Task created! ✅');
        await loadTasks();

    } catch (err) {
        showCreateAlert('Network error. Please try again.');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
});

function showCreateAlert(msg) {
    document.getElementById('createTaskAlertText').textContent = msg;
    document.getElementById('createTaskAlert').classList.add('show');
}

// =============================================
// INLINE STATUS CHANGE
// =============================================
// Called by onchange on the status <select> in each task card.
// Makes a PUT request updating ONLY the status field.
// The backend's updateTask endpoint handles any subset of fields.
async function handleStatusChange(taskId, selectEl) {
    const newStatus = selectEl.value;
    const prevStatus = allTasks.find(t => t.id === taskId)?.status;

    // Optimistically update the card's CSS class immediately
    const card = document.getElementById(`taskCard${taskId}`);
    if (card) {
        card.className = card.className
            .replace(/\bcompleted\b/, '')
            .trim();
        if (newStatus === 'Completed') card.classList.add('completed');
        selectEl.className = `status-select ${statusClass(newStatus)}`;
    }

    try {
        // Find the full task data to send all required fields
        const taskData = allTasks.find(t => t.id === taskId);

        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: taskData.title,
                description: taskData.description || '',
                priority: taskData.priority,
                status: newStatus,
                due_date: taskData.due_date || null,
                assigned_to: taskData.assigned_to || null
            })
        });

        const data = await res.json();

        if (!res.ok) {
            // Revert on failure
            showToast(data.message || 'Failed to update status.', 'error');
            selectEl.value = prevStatus;
            selectEl.className = `status-select ${statusClass(prevStatus)}`;
            return;
        }

        // Update our local state
        const idx = allTasks.findIndex(t => t.id === taskId);
        if (idx !== -1) allTasks[idx].status = newStatus;

        showToast(`Status updated to "${newStatus}"!`);

    } catch (err) {
        showToast('Network error. Try again.', 'error');
        selectEl.value = prevStatus;
    }
}

// =============================================
// EDIT TASK MODAL — Open & Pre-fill
// =============================================
// 'taskId' is the ID of the task to edit.
// We look it up from our allTasks array to pre-fill the form.
function openEditTaskModal(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // Fill form fields
    document.getElementById('editingTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskStatus').value = task.status;

    // Format date for the date input (needs YYYY-MM-DD)
    if (task.due_date) {
        const d = new Date(task.due_date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        document.getElementById('editTaskDueDate').value = `${yyyy}-${mm}-${dd}`;
    } else {
        document.getElementById('editTaskDueDate').value = '';
    }

    // Set assignee
    document.getElementById('editTaskAssignee').value = task.assigned_to || '';

    // Clear previous errors
    document.getElementById('editTaskAlert').classList.remove('show');

    // Open the modal
    document.getElementById('editTaskModal').classList.add('open');
    document.getElementById('editTaskTitle').focus();
}

// =============================================
// EDIT TASK FORM SUBMIT
// =============================================
// Sends: PUT /api/tasks/:id
// Body: all editable fields
document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editingTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const status = document.getElementById('editTaskStatus').value;
    const dueDate = document.getElementById('editTaskDueDate').value;
    const assignedTo = document.getElementById('editTaskAssignee').value;

    if (!title) {
        document.getElementById('editTaskAlertText').textContent = 'Task title is required.';
        document.getElementById('editTaskAlert').classList.add('show');
        return;
    }

    const saveBtn = document.getElementById('saveEditTask');
    saveBtn.classList.add('btn-loading');

    try {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                priority,
                status,
                due_date: dueDate || null,
                assigned_to: assignedTo || null
            })
        });

        const data = await res.json();

        if (!res.ok) {
            document.getElementById('editTaskAlertText').textContent = data.message || 'Failed to update task.';
            document.getElementById('editTaskAlert').classList.add('show');
            return;
        }

        // Success — update local state, close modal, refresh list
        closeEditTaskModal();
        showToast('Task updated! ✨');
        await loadTasks();

    } catch (err) {
        document.getElementById('editTaskAlertText').textContent = 'Network error. Please try again.';
        document.getElementById('editTaskAlert').classList.add('show');
    } finally {
        saveBtn.classList.remove('btn-loading');
    }
});

// =============================================
// EDIT TASK MODAL — Close
// =============================================
function closeEditTaskModal() {
    document.getElementById('editTaskModal').classList.remove('open');
}

document.getElementById('closeEditTaskModal').addEventListener('click', closeEditTaskModal);
document.getElementById('cancelEditTask').addEventListener('click', closeEditTaskModal);

document.getElementById('editTaskModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editTaskModal')) closeEditTaskModal();
});

// =============================================
// DELETE TASK — Open Confirm Modal
// =============================================
// Called by the onclick on each task card's delete button.
// We store the task's id + title so we can show it in the modal.
function promptDeleteTask(taskId, taskTitle) {
    taskToDelete = { id: taskId, title: taskTitle };
    document.getElementById('deleteTaskTitle').textContent = `"${taskTitle}"`;
    document.getElementById('deleteTaskModal').classList.add('open');
}

// =============================================
// DELETE TASK — Confirm & Execute
// =============================================
// Sends: DELETE /api/tasks/:id
// On success: remove the card from DOM, update count, show toast
document.getElementById('confirmDeleteTask').addEventListener('click', async () => {
    if (!taskToDelete) return;

    const btn = document.getElementById('confirmDeleteTask');
    btn.classList.add('btn-loading');

    try {
        const res = await fetch(`${API_BASE}/tasks/${taskToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.message || 'Failed to delete task.', 'error');
            closeDeleteTaskModal();
            return;
        }

        // Animate the card out before removing from DOM
        const card = document.getElementById(`taskCard${taskToDelete.id}`);
        if (card) {
            card.style.transition = 'all 0.25s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateX(-12px)';
            setTimeout(() => {
                // Remove from local state
                allTasks = allTasks.filter(t => t.id !== taskToDelete.id);
                // Re-render to update count and empty state
                const filter = document.querySelector('.filter-btn.active')?.dataset?.filter || 'all';
                renderTasks(filter);
            }, 250);
        }

        closeDeleteTaskModal();
        showToast(`"${taskToDelete.title}" deleted.`);

    } catch (err) {
        showToast('Network error. Try again.', 'error');
        closeDeleteTaskModal();
    } finally {
        btn.classList.remove('btn-loading');
        taskToDelete = null;
    }
});

// =============================================
// DELETE TASK MODAL — Close
// =============================================
function closeDeleteTaskModal() {
    document.getElementById('deleteTaskModal').classList.remove('open');
    taskToDelete = null;
}

document.getElementById('cancelDeleteTask').addEventListener('click', closeDeleteTaskModal);

document.getElementById('deleteTaskModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteTaskModal')) closeDeleteTaskModal();
});

// Also close task modals on Escape key
// (extends the existing keydown listener in project-detail.js)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditTaskModal();
        closeDeleteTaskModal();
    }
});

// =============================================
// INITIALISE
// =============================================
// Load members first (for assignee dropdowns),
// then load tasks. Both are async and run on page load.
loadMembersForTasks();
loadTasks();
