// =============================================
// Register Page JavaScript
// =============================================
// This script handles:
// 1. Registration form submission
// 2. Client-side validation (password match, length)
// 3. Sending data to the register API
// 4. Storing JWT token after successful registration
// 5. Password visibility toggle
// 6. Animated particles

const API_URL = 'http://localhost:5000/api';

// ---- DOM Elements ----
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const alertBox = document.getElementById('alertBox');
const alertMessage = document.getElementById('alertMessage');
const alertIcon = document.getElementById('alertIcon');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// =============================================
// Check if user is already logged in
// =============================================
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
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // --- Client-side Validation ---

    // Check all fields are filled
    if (!name || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Check password length
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    setLoading(true);

    try {
        // Send POST request to register API
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            // ---- Registration Successful ----
            // Store token and user info, just like login
            localStorage.setItem('taskflow_token', data.data.token);
            localStorage.setItem('taskflow_user', JSON.stringify({
                id: data.data.id,
                name: data.data.name,
                email: data.data.email
            }));

            showAlert('Account created successfully! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        } else {
            showAlert(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showAlert('Server error. Please try again later.', 'error');
        console.error('Registration error:', error);
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
// Helper Functions
// =============================================
function showAlert(message, type) {
    alertBox.className = `alert alert-${type} show`;
    alertMessage.textContent = message;
    alertIcon.innerHTML = type === 'error'
        ? `<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
        : `<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 5000);
}

function setLoading(isLoading) {
    if (isLoading) {
        registerBtn.classList.add('btn-loading');
    } else {
        registerBtn.classList.remove('btn-loading');
    }
}

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
