// =============================================
// phase6.js — Activity Feed & Task Comments
// =============================================

// =============================================
// 1. GLOBAL STATE & HELPERS
// =============================================
// We re-use token and API_BASE from the existing environment
// (assuming project-detail.js or tasks.js or kanban.js is loaded first).
// We'll rely on the existing `showToast` and `formatDate` if available.

let currentUserId = null; // We need this to know which comments we can delete

// Fetch the current user profile to get their ID
async function fetchCurrentUser() {
    try {
        const res = await fetch(`${API_BASE}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            currentUserId = data.data.id;
        }
    } catch (err) {
        console.error('Failed to fetch user profile for phase 6:', err);
    }
}
// Run immediately
fetchCurrentUser();

function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================
// 2. ACTIVITY FEED (Only on project-detail.html)
// =============================================
async function loadActivityFeed() {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return; // Not on project detail page

    try {
        // projectId is available globally from project-detail.js
        const res = await fetch(`${API_BASE}/projects/${projectId}/activity?limit=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            activityFeed.innerHTML = '<div class="activity-empty">Failed to load activity</div>';
            return;
        }

        const activities = data.data;

        if (activities.length === 0) {
            activityFeed.innerHTML = '<div class="activity-empty">No recent activity</div>';
            return;
        }

        activityFeed.innerHTML = activities.map(act => {
            const actorName = act.user_name || 'System';
            const initial = actorName.charAt(0).toUpperCase();
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">
                            <strong>${escapeHTML(actorName)}</strong> ${escapeHTML(act.action)}
                        </div>
                        <div class="activity-meta">
                            ${getRelativeTime(act.created_at)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('❌ loadActivityFeed error:', err);
        activityFeed.innerHTML = '<div class="activity-empty">Network error loading activity</div>';
    }
}

// If we are on the project page, refresh activity every time tasks reload
// We hook into window.loadTask as a naive approach, or just poll it.
if (document.getElementById('activityFeed')) {
    loadActivityFeed();
    // Refresh feed every 30 seconds
    setInterval(loadActivityFeed, 30000);
}

// =============================================
// 3. COMMENTS MODAL LOGIC
// =============================================
const commentsModal = document.getElementById('commentsModal');
const closeCommentsModal = document.getElementById('closeCommentsModal');
const commentsList = document.getElementById('commentsList');
const commentForm = document.getElementById('commentForm');
const commentText = document.getElementById('commentText');
const sendCommentBtn = document.getElementById('sendCommentBtn');
const commentsTaskTitle = document.getElementById('commentsTaskTitle');
const commentTaskId = document.getElementById('commentTaskId');

// Globally expose the function to open the modal
window.openCommentsModal = async function(taskId, taskTitle) {
    commentTaskId.value = taskId;
    commentsTaskTitle.textContent = `Comments: ${taskTitle}`;
    commentText.value = '';
    commentsList.innerHTML = '<div class="comments-empty">Loading...</div>';
    
    commentsModal.classList.add('open');
    await loadComments(taskId);
};

// Close modal
if (closeCommentsModal) {
    closeCommentsModal.addEventListener('click', () => {
        commentsModal.classList.remove('open');
    });
}

// Load comments for a task
async function loadComments(taskId) {
    try {
        const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            commentsList.innerHTML = '<div class="comments-empty">Failed to load comments</div>';
            return;
        }

        const comments = data.data;

        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="comments-empty">
                    <p>No comments yet. Be the first to start the discussion!</p>
                </div>`;
            return;
        }

        commentsList.innerHTML = comments.map(c => {
            const isMine = c.user_id === currentUserId;
            const initial = c.user_name.charAt(0).toUpperCase();

            // Only owner can delete
            const deleteBtn = isMine ? `
                <button class="comment-delete" onclick="deleteComment(${c.id}, ${taskId})" title="Delete Comment">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                </button>
            ` : '';

            return `
                <div class="comment-item ${isMine ? 'my-comment' : ''}">
                    <div class="comment-avatar">${initial}</div>
                    <div class="comment-bubble">
                        ${deleteBtn}
                        <div class="comment-header">
                            <span class="comment-author">${escapeHTML(c.user_name)}</span>
                            <span class="comment-time">${getRelativeTime(c.created_at)}</span>
                        </div>
                        <div class="comment-body">${escapeHTML(c.comment)}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        commentsList.scrollTop = commentsList.scrollHeight;

    } catch (err) {
        console.error('❌ loadComments error:', err);
        commentsList.innerHTML = '<div class="comments-empty">Network error loading comments</div>';
    }
}

// Submit new comment
if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskId = commentTaskId.value;
        const text = commentText.value.trim();
        
        if (!text) return;

        sendCommentBtn.disabled = true;
        sendCommentBtn.textContent = '...';

        try {
            const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ comment: text })
            });
            const data = await res.json();

            if (res.ok) {
                commentText.value = '';
                await loadComments(taskId);
                showToast('Comment posted');
                
                // Refresh activity feed if we are on the project page
                if (document.getElementById('activityFeed')) {
                    loadActivityFeed();
                }
            } else {
                showToast(data.message || 'Failed to post comment', 'error');
            }
        } catch (err) {
            showToast('Network error', 'error');
        } finally {
            sendCommentBtn.disabled = false;
            sendCommentBtn.textContent = 'Send';
        }
    });
}

// Delete comment (globally exposed for inline onclick)
window.deleteComment = async function(commentId, taskId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
        const res = await fetch(`${API_BASE}/tasks/${taskId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Comment deleted');
            await loadComments(taskId);
        } else {
            showToast(data.message || 'Failed to delete', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
};
