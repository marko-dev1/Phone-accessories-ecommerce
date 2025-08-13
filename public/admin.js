// admin.js
async function checkAdminStatus() {
    try {
        const response = await fetch('/api/auth/current-user', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const user = await response.json();
            return user.role === 'admin';
        }
        return false;
    } catch (error) {
        console.error('Admin check failed:', error);
        return false;
    }
}

function setupAdminUI(isAdmin) {
    if (isAdmin) {
        // Show admin controls
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
        
        // Add event listeners for admin actions
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('admin-action')) {
                // Handle admin actions
            }
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminStatus();
    setupAdminUI(isAdmin);
});