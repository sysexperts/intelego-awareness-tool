document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.location.href = '/dashboard.html';
        } else {
            errorMessage.textContent = data.error || 'Login fehlgeschlagen';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
        errorMessage.style.display = 'block';
    }
});
