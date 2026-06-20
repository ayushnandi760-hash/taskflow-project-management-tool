// =============================================
// kanban.js — Phase 5: Kanban Board
// =============================================
//
// HOW THIS PAGE WORKS  (big picture):
// ─────────────────────────────────────────────
// 1.  The URL contains ?id=5  (the project ID).
// 2.  On load we call GET /api/tasks?project_id=5
//     and receive ALL tasks for that project.
// 3.  We sort each task into its matching column
//     based on task.status.
// 4.  Each task becomes a draggable <div> card.
// 5.  Each column is a drop-zone.
// 6.  When the user drags a card from one column
//     and drops it onto another:
//       a. We move the card in the DOM immediately
//          (so the UI feels instant — no lag).
//       b. We call PUT /api/tasks/:id with the
//          new status to persist the change.
//       c. If the server returns an error, we move
//          the card back and show a toast.
//
// DRAG-AND-DROP TECHNIQUE:
// ─────────────────────────────────────────────
// We use the browser's NATIVE HTML5 Drag-and-Drop API.
// No external libraries needed.
//
// Key events used:
//   dragstart  — fires the moment the user starts dragging a card
//   dragend    — fires when the user releases the mouse
//   dragover   — fires continuously while a dragged item is over a zone
//   dragleave  — fires when the dragged item leaves a zone
//   drop       — fires when the user releases the mouse over a zone
//
// KEY CONCEPT — dataTransfer:
//   When a drag starts, we STORE data (like the task ID) in a
//   special object called `dataTransfer`. When the user drops,
//   we READ that data to know which card was moved.
//
// =============================================

// ---- Config ----
const API_BASE = 'http://localhost:5000/api';
const token = localStorage.getItem('taskflow_token');

// Auth guard — if no token, send to login
if (!token) {
    window.location.href = 'login.html';
}

// Read the project ID from ?id=5 in the URL
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

if (!projectId) {
    window.location.href = 'projects.html';
}

// ---- State ----
// `allTasks` is our in-memory copy of all tasks.
// We update it whenever a card moves columns, so
// we always have the latest status without re-fetching.
let allTasks = [];

// This remembers which card is currently being dragged.
// We store the whole task object (not just the ID).
let draggedTask = null;

// This remembers the placeholder element we insert while dragging.
let placeholder = null;

// =============================================
// PARTICLES BACKGROUND
// =============================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 15 + 10) + 's';
        p.style.animationDelay = (Math.random() * 8) + 's';
        container.appendChild(p);
    }
}
createParticles();

// =============================================
// TOAST NOTIFICATIONS
// =============================================
// A toast is a small pop-up notification at the
// bottom-right of the screen. It disappears after 3s.
function showToast(message, type = 'success') {
    const toast    = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon= document.getElementById('toastIcon');

    // Reset classes, then apply the type
    toast.className = `toast toast-${type} show`;
    toastIcon.textContent = type === 'success' ? '✅' : '❌';
    toastMsg.textContent  = message;

    // Auto-hide after 3 seconds
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// =============================================
// HTML ESCAPE  (Security)
// =============================================
// ALWAYS escape user content before inserting into HTML.
// This prevents XSS attacks — e.g., if a task title
// contained <script>alert('hacked')</script>, without
// escaping it would execute in the browser.
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

// =============================================
// DATE UTILITIES
// =============================================
function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}

function isOverdue(dateString) {
    if (!dateString) return false;
    const due   = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
}

// =============================================
// LOAD USER INFO  (fills the navbar)
// =============================================
async function loadUserInfo() {
    try {
        const res  = await fetch(`${API_BASE}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            localStorage.removeItem('taskflow_token');
            window.location.href = 'login.html';
            return;
        }
        const data = await res.json();
        const user = data.data;
        document.getElementById('navAvatar').textContent   = user.name.charAt(0).toUpperCase();
        document.getElementById('navUserName').textContent = user.name;
    } catch (err) {
        console.error('❌ loadUserInfo error:', err);
    }
}

// =============================================
// LOAD PROJECT INFO  (fills board title)
// =============================================
async function loadProjectInfo() {
    try {
        const res  = await fetch(`${API_BASE}/projects/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const proj = data.data;

        document.title = `${proj.name} — Kanban | TaskFlow`;
        document.getElementById('boardProjectName').textContent = proj.name;

        // Fix the "Back to Project" link to include the project ID
        document.getElementById('backToProject').href =
            `project-detail.html?id=${projectId}`;
    } catch (err) {
        console.error('❌ loadProjectInfo error:', err);
    }
}

// =============================================
// BUILD ONE KANBAN CARD ELEMENT
// =============================================
// This function takes a task object from the API
// and returns a DOM element (a draggable card).
//
// EVERY card gets these HTML5 attributes:
//   draggable="true"   — tells the browser "this element can be dragged"
//   id="kcard-42"      — unique ID so we can find the element later
function buildCard(task) {
    const priorityLower = (task.priority || 'medium').toLowerCase();
    const isCompleted   = task.status === 'Completed';

    // ── Priority badge ──
    const badgeHTML = `
        <span class="k-badge ${priorityLower}">
            <span class="k-dot"></span>
            ${escapeHTML(task.priority)}
        </span>`;

    // ── Assignee chip ──
    // If no assignee, show nothing.
    // Otherwise show first initial in a coloured circle + name.
    const assigneeHTML = task.assignee_name ? `
        <span class="k-assignee">
            <span class="k-avatar">${escapeHTML(task.assignee_name.charAt(0).toUpperCase())}</span>
            ${escapeHTML(task.assignee_name)}
        </span>` : '';

    // ── Due date chip ──
    let dueHTML = '';
    if (task.due_date) {
        const overdue = isOverdue(task.due_date) && !isCompleted;
        dueHTML = `
            <span class="k-due ${overdue ? 'overdue' : ''}">
                <svg viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8"  y1="2" x2="8"  y2="6"/>
                    <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                ${overdue ? '⚠️ ' : ''}${formatDate(task.due_date)}
            </span>`;
    }

    // ── Create the card DOM element ──
    const card = document.createElement('div');
    card.className = `k-card priority-${priorityLower}${isCompleted ? ' completed' : ''}`;
    card.id        = `kcard-${task.id}`;

    // draggable="true" is the magic attribute that
    // activates the HTML5 drag-and-drop system
    card.setAttribute('draggable', 'true');

    // Store the task ID on the element — handy shortcut
    card.dataset.taskId = task.id;

    // ── Comments button ──
    const commentsBtnHTML = `
        <button class="k-comments-btn" onclick="openCommentsModal(${task.id}, '${escapeHTML(task.title).replace(/'/g, "&#39;")}')" title="Comments">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>`;

    card.innerHTML = `
        <div class="k-card-title">${escapeHTML(task.title)}</div>
        <div class="k-card-meta">
            ${badgeHTML}
            ${assigneeHTML}
            ${dueHTML}
            ${commentsBtnHTML}
        </div>`;

    // ── Wire up drag events ──
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend',   onDragEnd);

    return card;
}

// =============================================
// RENDER THE BOARD
// =============================================
// Clears all three columns and re-populates them
// from the `allTasks` array.
function renderBoard() {
    const statuses = ['To Do', 'In Progress', 'Completed'];

    statuses.forEach(status => {
        const cardsZone = document.getElementById(`cards-${status}`);
        const countEl   = document.getElementById(`count-${status}`);

        // Clear skeletons or previous cards
        cardsZone.innerHTML = '';

        // Filter tasks for this column
        const tasksForCol = allTasks.filter(t => t.status === status);

        // Update count badge
        countEl.textContent = tasksForCol.length;

        if (tasksForCol.length === 0) {
            // Show a friendly empty-state placeholder
            cardsZone.innerHTML = `
                <div class="col-empty">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="9" y1="9" x2="15" y2="9"/>
                        <line x1="9" y1="13" x2="12" y2="13"/>
                    </svg>
                    Drop tasks here
                </div>`;
        } else {
            tasksForCol.forEach((task, i) => {
                const card = buildCard(task);
                card.style.animationDelay = `${i * 0.05}s`;
                cardsZone.appendChild(card);
            });
        }

        // Wire up drop events on the drop zone
        cardsZone.addEventListener('dragover',  onDragOver);
        cardsZone.addEventListener('dragleave', onDragLeave);
        cardsZone.addEventListener('drop',      onDrop);
    });
}

// =============================================
// LOAD TASKS FROM API
// =============================================
async function loadTasks() {
    try {
        const res  = await fetch(`${API_BASE}/tasks?project_id=${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            showToast('Failed to load tasks.', 'error');
            return;
        }

        allTasks = data.data;
        renderBoard();

    } catch (err) {
        console.error('❌ loadTasks error:', err);
        showToast('Network error loading tasks.', 'error');
    }
}

// =============================================
// =============================================
// DRAG-AND-DROP  (the heart of Phase 5)
// =============================================
// =============================================
//
// HOW DRAG-AND-DROP WORKS — step by step:
//
// STEP 1  dragstart  (the moment you click and hold a card)
//   The browser fires this event on the CARD being dragged.
//   We:
//     - Store which task is being dragged in `draggedTask`
//     - Add a "dragging" CSS class to fade the original card
//     - Write the task ID into `dataTransfer` (the browser's
//       built-in clipboard for drag operations)
//
// STEP 2  dragover  (every ~50ms while hovering over a column)
//   The browser fires this on the drop ZONE (col-cards).
//   IMPORTANT: By default the browser does NOT allow drops.
//   We MUST call `event.preventDefault()` to say "yes, accept drops here".
//   We also highlight the column to give visual feedback.
//   We insert a dashed placeholder to show WHERE the card will land.
//
// STEP 3  dragleave  (cursor leaves the column without dropping)
//   We remove the highlight and placeholder.
//
// STEP 4  drop  (user releases the mouse inside a column)
//   We:
//     - Read the task ID from dataTransfer
//     - Find which column was dropped onto (new status)
//     - Move the card in the DOM immediately (optimistic update)
//     - Call PUT /api/tasks/:id to save the new status
//     - If the server fails, move the card back
//
// STEP 5  dragend  (always fires after drag, success or cancel)
//   We clean up: remove the "dragging" class, remove placeholder.
// =============================================

// ── STEP 1: dragstart ──
function onDragStart(event) {
    // `this` refers to the card element that was dragged
    const card = this;

    // Find which task this card represents
    const taskId = parseInt(card.dataset.taskId, 10);
    draggedTask  = allTasks.find(t => t.id === taskId);

    // Store the task ID in dataTransfer.
    // This is the browser's built-in "clipboard" for drag operations.
    // setData(format, value) — we use plain text format.
    event.dataTransfer.setData('text/plain', String(taskId));

    // Tell the browser what kind of drag operation this is
    // 'move' means the item will be relocated, not copied
    event.dataTransfer.effectAllowed = 'move';

    // Fade the original card so the user knows it's moving
    // setTimeout 0 delays this by one frame so the "ghost image"
    // the browser creates still looks normal (not faded)
    setTimeout(() => card.classList.add('dragging'), 0);
}

// ── STEP 2: dragover ──
function onDragOver(event) {
    // THIS IS THE MOST IMPORTANT LINE in drag-and-drop!
    // Without it, the browser prevents dropping.
    event.preventDefault();

    // `this` = the col-cards div being hovered over
    const cardsZone = this;
    const col       = cardsZone.closest('.kanban-col');

    // Highlight the whole column
    col.classList.add('drag-over');

    // Tell the browser we want a "move" cursor
    event.dataTransfer.dropEffect = 'move';

    // Create a placeholder dashed box if it doesn't exist yet
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
    }

    // Figure out WHERE in the column the card should be inserted.
    // We find the card that the cursor is currently above.
    const afterEl = getDragAfterElement(cardsZone, event.clientY);

    // Insert the placeholder at that position
    if (afterEl === null) {
        // No card below cursor → insert at the end
        cardsZone.appendChild(placeholder);
    } else {
        // Insert BEFORE the card that's below the cursor
        cardsZone.insertBefore(placeholder, afterEl);
    }
}

// ── STEP 3: dragleave ──
function onDragLeave(event) {
    // Only remove highlight if the cursor actually left the column.
    // relatedTarget is the element the cursor moved INTO.
    const cardsZone = this;
    const col       = cardsZone.closest('.kanban-col');

    // Check if we moved into a child element (still inside the column)
    if (!col.contains(event.relatedTarget)) {
        col.classList.remove('drag-over');
        if (placeholder && placeholder.parentNode === cardsZone) {
            cardsZone.removeChild(placeholder);
        }
        placeholder = null;
    }
}

// ── STEP 4: drop ──
async function onDrop(event) {
    event.preventDefault();  // Prevent browser's default drop behaviour

    const cardsZone = this;
    const col       = cardsZone.closest('.kanban-col');
    const newStatus = col.dataset.status;   // e.g. "In Progress"

    // Remove highlight and placeholder
    col.classList.remove('drag-over');
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null;

    // Safety check — did we actually have a dragged task?
    if (!draggedTask) return;

    // If dropped onto the SAME column, do nothing
    if (draggedTask.status === newStatus) return;

    // ── Move the card in the DOM immediately ──
    // This gives instant visual feedback. The database
    // update runs in the background.
    const oldStatus = draggedTask.status;
    const taskId    = draggedTask.id;

    // 1. Remove from old column in `allTasks` array
    // 2. Update its status
    // 3. Re-render the board
    const idx = allTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;

    allTasks[idx].status = newStatus;   // ← optimistic state update
    renderBoard();                       // ← re-render with new status

    // Mark the card as "syncing" (shows a spinner overlay)
    const cardEl = document.getElementById(`kcard-${taskId}`);
    if (cardEl) cardEl.classList.add('syncing');

    // ── Send the update to the backend ──
    try {
        const taskData = allTasks[idx];

        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title:       taskData.title,
                description: taskData.description  || '',
                priority:    taskData.priority,
                status:      newStatus,               // ← the new status
                due_date:    taskData.due_date    || null,
                assigned_to: taskData.assigned_to || null
            })
        });

        const data = await res.json();

        if (!res.ok) {
            // Server rejected the update — REVERT the move
            allTasks[idx].status = oldStatus;
            renderBoard();
            showToast(data.message || 'Failed to move task.', 'error');
            return;
        }

        showToast(`Moved to "${newStatus}" ✨`);

    } catch (err) {
        // Network error — REVERT
        allTasks[idx].status = oldStatus;
        renderBoard();
        showToast('Network error. Move reverted.', 'error');
    }
}

// ── STEP 5: dragend ──
function onDragEnd() {
    // Clean up dragging class from the original card
    this.classList.remove('dragging');
    draggedTask = null;

    // Remove any leftover placeholder
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
        placeholder = null;
    }

    // Remove drag-over highlight from all columns
    document.querySelectorAll('.kanban-col').forEach(col => {
        col.classList.remove('drag-over');
    });
}

// =============================================
// HELPER: Find where to insert the card
// =============================================
// When dragging over a column, we want the card to
// "snap" into position relative to other cards.
//
// This function returns the card element BELOW the cursor,
// so we can insert our placeholder BEFORE it.
// Returns null if the cursor is below all cards (→ append at end).
//
// HOW IT WORKS:
//   1. Get all draggable cards in the column (except the one being dragged)
//   2. For each card, calculate: does its centre point fall BELOW the cursor?
//   3. Return the first card whose centre is below the cursor
function getDragAfterElement(container, y) {
    // querySelectorAll returns all k-card elements that are NOT .dragging
    const draggableEls = [
        ...container.querySelectorAll('.k-card:not(.dragging)')
    ];

    // reduce() visits each card and keeps track of the "closest" one
    return draggableEls.reduce((closest, child) => {
        // getBoundingClientRect() gives the card's position on screen
        const box    = child.getBoundingClientRect();
        // offset = distance from the cursor to the card's vertical midpoint
        const offset = y - box.top - box.height / 2;

        // We want the card where offset is negative but closest to 0
        // (negative = the card's midpoint is BELOW the cursor)
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element || null;
}

// =============================================
// REFRESH BUTTON
// =============================================
document.getElementById('refreshBoardBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBoardBtn');
    btn.classList.add('spinning');

    // Show skeletons while loading
    ['To Do', 'In Progress', 'Completed'].forEach(s => {
        const zone = document.getElementById(`cards-${s}`);
        zone.innerHTML = '<div class="k-skeleton"></div>';
    });

    await loadTasks();

    setTimeout(() => btn.classList.remove('spinning'), 600);
    showToast('Board refreshed!');
});

// =============================================
// LOGOUT
// =============================================
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('taskflow_token');
    window.location.href = 'login.html';
});

// =============================================
// INITIALISE
// =============================================
// Run everything in parallel using Promise.all so the
// page loads as fast as possible
Promise.all([
    loadUserInfo(),
    loadProjectInfo(),
    loadTasks()
]);
