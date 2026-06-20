// =============================================
// Profile Page JavaScript
// =============================================
// This script handles:
// 1. Checking authentication (redirects to login if no token)
// 2. Fetching user profile from the protected API
// 3. Displaying user data with loading skeleton
// 4. Logout functionality
// 5. Animated particles

const API_URL = 'http://localhost:5000/api';

// ---- DOM Elements ----
const profileSkeleton = document.getElementById('profileSkeleton');
const profileData = document.getElementById('profileData');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileRole = document.getElementById('profileRole');
const profileEmail = document.getElementById('profileEmail');
const profileId = document.getElementById('profileId');
const profileDate = document.getElementById('profileDate');
const logoutBtn = document.getElementById('logoutBtn');

// =============================================
// On Page Load: Check Auth & Fetch Profile
// =============================================
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('taskflow_token');

    // If no token, redirect to login
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    fetchProfile(token);
    createParticles();
});

// =============================================
// Fetch User Profile from API
// =============================================
async function fetchProfile(token) {
    try {
        // Send GET request with JWT token in the Authorization header
        // This is how protected routes verify the user's identity
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            displayProfile(data.data);
        } else {
            // Token is invalid or expired
            handleAuthError();
        }
    } catch (error) {
        console.error('Profile fetch error:', error);
        handleAuthError();
    }
}

// =============================================
// Display Profile Data
// =============================================
function displayProfile(user) {
    // Set avatar initial (first letter of name)
    profileAvatar.textContent = user.name.charAt(0).toUpperCase();

    // Set profile details
    profileName.textContent = user.name;
    profileEmail.textContent = user.email;
    profileId.textContent = `#${user.id}`;

    // Set role badge
    profileRole.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        ${user.role}
    `;

    // Format the date (e.g., "June 15, 2026")
    const date = new Date(user.created_at);
    profileDate.textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Hide skeleton, show real data
    profileSkeleton.style.display = 'none';
    profileData.style.display = 'block';
}

// =============================================
// Handle Authentication Error
// =============================================
function handleAuthError() {
    // Clear stored data
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    // Redirect to login
    window.location.href = 'login.html';
}

// =============================================
// Logout Handler
// =============================================
logoutBtn.addEventListener('click', () => {
    // Clear all stored auth data
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    // Redirect to login page
    window.location.href = 'login.html';
});

// =============================================
// Background Particles
// =============================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        particle.style.width = (Math.random() * 3 + 1) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}
