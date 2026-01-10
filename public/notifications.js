// Notification System
let notificationCheckInterval = null;
let lastNotificationCheck = null;

// Start notification polling
function startNotificationPolling() {
    checkForNewNotifications();
    notificationCheckInterval = setInterval(checkForNewNotifications, 30000);
}

// Stop notification polling
function stopNotificationPolling() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
    }
}

// Check for new notifications
async function checkForNewNotifications() {
    try {
        const response = await fetch('/api/notifications/unread');
        if (response.ok) {
            const notifications = await response.json();
            updateNotificationBadge(notifications.length);
            
            if (lastNotificationCheck && notifications.length > 0) {
                const newNotifications = notifications.filter(n => 
                    new Date(n.created_at) > lastNotificationCheck
                );
                
                newNotifications.forEach(notification => {
                    showToast(notification);
                });
            }
            
            lastNotificationCheck = new Date();
        }
    } catch (error) {
        console.error('Fehler beim Laden der Notifications:', error);
    }
}

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Toggle notification popup
async function toggleNotifications() {
    const popup = document.getElementById('notificationPopup');
    const isVisible = popup.classList.contains('show');
    
    if (isVisible) {
        popup.classList.remove('show');
    } else {
        popup.classList.add('show');
        await loadNotifications();
    }
}

// Close notification popup when clicking outside
document.addEventListener('click', (e) => {
    const popup = document.getElementById('notificationPopup');
    const bell = document.querySelector('.notification-bell');
    
    if (popup.classList.contains('show') && 
        !popup.contains(e.target) && 
        !bell.contains(e.target)) {
        popup.classList.remove('show');
    }
});

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications?limit=50');
        if (response.ok) {
            const notifications = await response.json();
            renderNotifications(notifications);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Notifications:', error);
    }
}

// Render notifications
function renderNotifications(notifications) {
    const list = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <p>Keine Benachrichtigungen</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.map(notification => {
        const date = new Date(notification.created_at + 'Z');
        const timeAgo = getTimeAgo(date);
        const unreadClass = notification.is_read ? '' : 'unread';
        
        return `
            <div class="notification-item ${unreadClass}" onclick="handleNotificationClick(${notification.id}, ${notification.report_id})">
                <div class="notification-item-header">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-message">${notification.message}</div>
                ${notification.customer_name ? `<span class="notification-customer">${notification.customer_name}</span>` : ''}
                <button class="notification-delete" onclick="event.stopPropagation(); deleteNotification(${notification.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

// Handle notification click
async function handleNotificationClick(notificationId, reportId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
        await checkForNewNotifications();
        await loadNotifications();
    } catch (error) {
        console.error('Fehler beim Markieren der Notification:', error);
    }
    
    document.getElementById('notificationPopup').classList.remove('show');
    
    if (reportId) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.nav-item')[2].classList.add('active');
        document.getElementById('reportsTab').classList.add('active');
        loadReports();
    }
}

// Delete notification
async function deleteNotification(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
        if (response.ok) {
            await checkForNewNotifications();
            await loadNotifications();
        }
    } catch (error) {
        console.error('Fehler beim Löschen der Notification:', error);
    }
}

// Mark all as read
async function markAllAsRead() {
    try {
        const response = await fetch('/api/notifications/read-all', { method: 'POST' });
        if (response.ok) {
            await checkForNewNotifications();
            await loadNotifications();
        }
    } catch (error) {
        console.error('Fehler beim Markieren aller Notifications:', error);
    }
}

// Show toast notification
function showToast(notification) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
        </div>
        <div class="toast-content">
            <div class="toast-title">${notification.title}</div>
            <div class="toast-message">${notification.customer_name || 'Neuer Report verfügbar'}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Gerade eben';
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min.`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std.`;
    if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
    
    return date.toLocaleDateString('de-DE');
}

// Auto-start polling when page loads
if (typeof checkAuth !== 'undefined') {
    checkAuth().then(authenticated => {
        if (authenticated) {
            startNotificationPolling();
        }
    });
}
