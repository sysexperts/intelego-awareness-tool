// E-Mail Settings Functions

async function loadEmailSettings() {
    try {
        const response = await fetch('/api/email-settings');
        if (response.ok) {
            const settings = await response.json();
            
            document.getElementById('imapHost').value = settings.imapHost || '';
            document.getElementById('imapPort').value = settings.imapPort || 993;
            document.getElementById('emailUsername').value = settings.emailUsername || '';
            document.getElementById('emailPassword').value = settings.emailPassword || '';
            document.getElementById('monitoringFolder').value = settings.monitoringFolder || 'INBOX';
            document.getElementById('checkInterval').value = settings.checkInterval || 15;
            document.getElementById('monitoringEnabled').checked = settings.monitoringEnabled || false;
            
            document.getElementById('smtpHost').value = settings.smtpHost || '';
            document.getElementById('smtpPort').value = settings.smtpPort || 587;
            document.getElementById('smtpUsername').value = settings.smtpUsername || '';
            document.getElementById('smtpPassword').value = settings.smtpPassword || '';
            document.getElementById('smtpFrom').value = settings.smtpFrom || '';
        }
    } catch (error) {
        console.error('Fehler beim Laden der E-Mail-Einstellungen:', error);
    }
}

async function testEmailConnection() {
    const statusDiv = document.getElementById('emailStatusMessage');
    statusDiv.innerHTML = '<div class="info-text">Verbindung wird getestet...</div>';
    
    const settings = {
        imapHost: document.getElementById('imapHost').value,
        imapPort: parseInt(document.getElementById('imapPort').value),
        emailUsername: document.getElementById('emailUsername').value,
        emailPassword: document.getElementById('emailPassword').value,
        monitoringFolder: document.getElementById('monitoringFolder').value
    };
    
    try {
        const response = await fetch('/api/email-settings/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            statusDiv.innerHTML = `
                <div class="success-message">
                    <strong>✓ Verbindung erfolgreich!</strong><br>
                    ${result.message}
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="error-message">
                    <strong>✗ Verbindung fehlgeschlagen</strong><br>
                    ${result.error}
                </div>
            `;
        }
    } catch (error) {
        statusDiv.innerHTML = `
            <div class="error-message">
                <strong>✗ Fehler beim Testen der Verbindung</strong><br>
                ${error.message}
            </div>
        `;
    }
}

document.getElementById('emailSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const statusDiv = document.getElementById('emailStatusMessage');
    statusDiv.innerHTML = '<div class="info-text">Einstellungen werden gespeichert...</div>';
    
    const settings = {
        imapHost: document.getElementById('imapHost').value,
        imapPort: parseInt(document.getElementById('imapPort').value),
        emailUsername: document.getElementById('emailUsername').value,
        emailPassword: document.getElementById('emailPassword').value,
        monitoringFolder: document.getElementById('monitoringFolder').value,
        checkInterval: parseInt(document.getElementById('checkInterval').value),
        monitoringEnabled: document.getElementById('monitoringEnabled').checked,
        smtpHost: document.getElementById('smtpHost').value,
        smtpPort: parseInt(document.getElementById('smtpPort').value),
        smtpUsername: document.getElementById('smtpUsername').value,
        smtpPassword: document.getElementById('smtpPassword').value,
        smtpFrom: document.getElementById('smtpFrom').value
    };
    
    try {
        const response = await fetch('/api/email-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            statusDiv.innerHTML = `
                <div class="success-message">
                    <strong>✓ Einstellungen gespeichert!</strong><br>
                    ${result.message}
                    ${settings.monitoringEnabled ? '<br><br>E-Mail-Monitoring wurde gestartet und läuft im Hintergrund.' : ''}
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="error-message">
                    <strong>✗ Fehler beim Speichern</strong><br>
                    ${result.error}
                </div>
            `;
        }
    } catch (error) {
        statusDiv.innerHTML = `
            <div class="error-message">
                <strong>✗ Fehler beim Speichern der Einstellungen</strong><br>
                ${error.message}
            </div>
        `;
    }
});
