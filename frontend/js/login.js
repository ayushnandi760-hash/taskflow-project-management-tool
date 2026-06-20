// =============================================
// Login Page JavaScript
// =============================================
// This script handles:
// 1. Form submission (sending login data to the API)
// 2. Storing the JWT token in localStorage
// 3. Showing success/error alerts
// 4. Password visibility toggle
// 5. Animated particles in the background
// 6. Redirecting to profile if already logged in

const API_URL = 'http://localhost:5000/api';

// ---- DOM Elements ----
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const alertBox = document.getElementById('alertBox');
const alertMessage = document.getElementById('alertMessage');
const alertIcon = document.getElementById('alertIcon');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// =============================================
// Check if user is already logged in
// =============================================
// If a token exists in localStorage, skip login page
// and go directly to the profile page.
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
        window.location.href = 'profile.html';
    }
    createParticles();
});

// =============================================
// Form Submission Handler
// =============================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();  // Prevent page reload

    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Show loading state on button
    setLoading(true);

    try {
        // Send POST request to login API
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // ---- Login Successful ----
            // Store the JWT token in localStorage
            // localStorage persists data even after the browser is closed
            localStorage.setItem('taskflow_token', data.data.token);
            localStorage.setItem('taskflow_user', JSON.stringify({
                id: data.data.id,
                name: data.data.name,
                email: data.data.email,
                role: data.data.role
            }));

            showAlert('Login successful! Redirecting...', 'success');

            // Redirect to profile page after a short delay
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        } else {
            // ---- Login Failed ----
            showAlert(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showAlert('Server error. Please try again later.', 'error');
        console.error('Login error:', error);
    } finally {
        setLoading(false);
    }
});

// =============================================
// Password Visibility Toggle
// =============================================
togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;

    // Change icon based on visibility
    togglePassword.innerHTML = type === 'password'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
           </svg>`;
});

// =============================================
// Helper: Show Alert Message
// =============================================
function showAlert(message, type) {
    alertBox.className = `alert alert-${type} show`;
    alertMessage.textContent = message;
    alertIcon.innerHTML = type === 'error'
        ? `<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
        : `<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 5000);
}

// =============================================
// Helper: Set Loading State on Button
// =============================================
function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.classList.add('btn-loading');
    } else {
        loginBtn.classList.remove('btn-loading');
    }
}

// =============================================
// Background Particles Animation
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
