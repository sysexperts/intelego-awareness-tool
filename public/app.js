async function checkServerStatus() {
    const statusElement = document.getElementById('status');
    
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'ok') {
            statusElement.innerHTML = '<span>🟢 Server läuft</span>';
            statusElement.classList.add('online');
            statusElement.classList.remove('offline');
        }
    } catch (error) {
        statusElement.innerHTML = '<span>🔴 Server offline</span>';
        statusElement.classList.add('offline');
        statusElement.classList.remove('online');
    }
}

checkServerStatus();

setInterval(checkServerStatus, 5000);
