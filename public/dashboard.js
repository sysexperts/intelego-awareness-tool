let currentTab = 'customers';
let customers = [];
let reports = [];

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login.html';
            return false;
        }
        
        document.getElementById('usernameDisplay').textContent = data.username;
        return true;
    } catch (error) {
        window.location.href = '/login.html';
        return false;
    }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
}

function switchTab(tabName) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked nav item
    event.target.closest('.nav-item').classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    currentTab = tabName;
    
    if (tabName === 'customers') {
        loadCustomers();
    } else if (tabName === 'upload') {
        loadCustomersForSelect();
    } else if (tabName === 'reports') {
        loadReports();
    }
}

async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        customers = await response.json();
        
        const customersList = document.getElementById('customersList');
        
        if (customers.length === 0) {
            customersList.innerHTML = '<p class="empty-state">Keine Kunden vorhanden. Erstellen Sie einen neuen Kunden.</p>';
            return;
        }
        
        customersList.innerHTML = customers.map(customer => `
            <div class="customer-card">
                <div class="customer-info">
                    <h3>${customer.name}</h3>
                    <p class="text-muted">Erstellt: ${new Date(customer.created_at).toLocaleDateString('de-DE')}</p>
                </div>
                <button onclick="deleteCustomer(${customer.id})" class="btn btn-danger btn-sm">Löschen</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
    }
}

async function loadCustomersForSelect() {
    try {
        const response = await fetch('/api/customers');
        customers = await response.json();
        
        const select = document.getElementById('customerSelect');
        select.innerHTML = '<option value="">-- Kunde auswählen --</option>' + 
            customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
    }
}

async function loadReports() {
    try {
        const response = await fetch('/api/reports');
        reports = await response.json();
        
        const reportsList = document.getElementById('reportsList');
        
        if (reports.length === 0) {
            reportsList.innerHTML = '<p class="empty-state">Keine Reports vorhanden. Laden Sie eine ZIP-Datei hoch.</p>';
            return;
        }
        
        reportsList.innerHTML = reports.map(report => {
            const riskClass = report.risk_level === 'Kritisch' ? 'risk-critical' : 
                             report.risk_level === 'Hoch' ? 'risk-high' : 
                             report.risk_level === 'Mittel' ? 'risk-medium' : 'risk-low';
            
            return `
                <div class="report-card">
                    <div class="report-header">
                        <h3>${report.customer_name}</h3>
                        <span class="risk-badge ${riskClass}">${report.risk_level}</span>
                    </div>
                    <div class="report-stats">
                        <div class="stat">
                            <span class="stat-label">Klickrate</span>
                            <span class="stat-value">${report.click_rate}%</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Erfolgsquote</span>
                            <span class="stat-value">${report.success_rate}%</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Szenarien</span>
                            <span class="stat-value">${report.total_scenarios}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Benutzer</span>
                            <span class="stat-value">${report.total_users}</span>
                        </div>
                    </div>
                    <div class="report-footer">
                        <span class="text-muted">${new Date(report.upload_date).toLocaleString('de-DE')}</span>
                        <div>
                            ${report.email_sent ? '<span class="badge-success">✓ E-Mail versendet</span>' : ''}
                            <a href="/api/reports/download/${report.id}" class="btn btn-primary btn-sm">PDF Download</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Fehler beim Laden der Reports:', error);
    }
}

function showAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'flex';
}

function closeAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'none';
    document.getElementById('addCustomerForm').reset();
}

document.getElementById('addCustomerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value;
    
    try {
        const response = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        
        if (response.ok) {
            closeAddCustomerModal();
            loadCustomers();
        } else {
            const data = await response.json();
            alert('Fehler: ' + data.error);
        }
    } catch (error) {
        alert('Fehler beim Erstellen des Kunden');
    }
});

async function deleteCustomer(id) {
    if (!confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            loadCustomers();
        } else {
            const data = await response.json();
            alert('Fehler: ' + data.error);
        }
    } catch (error) {
        alert('Fehler beim Löschen des Kunden');
    }
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const customerId = document.getElementById('customerSelect').value;
    const recipientEmail = document.getElementById('recipientEmail').value;
    const zipFile = document.getElementById('zipFile').files[0];
    
    if (!customerId || !zipFile) {
        alert('Bitte wählen Sie einen Kunden und eine ZIP-Datei aus');
        return;
    }
    
    const formData = new FormData();
    formData.append('zipfile', zipFile);
    formData.append('customerId', customerId);
    if (recipientEmail) {
        formData.append('recipientEmail', recipientEmail);
    }
    
    const progressDiv = document.getElementById('uploadProgress');
    const resultDiv = document.getElementById('uploadResult');
    
    progressDiv.style.display = 'block';
    resultDiv.style.display = 'none';
    
    try {
        const response = await fetch('/api/reports/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        progressDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        
        if (response.ok) {
            resultDiv.className = 'alert alert-success';
            resultDiv.innerHTML = `
                <h4>✓ Analyse erfolgreich!</h4>
                <p><strong>Risikostufe:</strong> ${data.analysis.overview.riskLevel}</p>
                <p><strong>Klickrate:</strong> ${data.analysis.overview.clickRate}%</p>
                <p><strong>Erfolgsquote:</strong> ${data.analysis.overview.successRate}%</p>
                ${data.emailSent ? '<p>✓ E-Mail wurde versendet</p>' : ''}
                <a href="${data.pdfPath}" class="btn btn-primary" style="margin-top: 10px;">PDF herunterladen</a>
            `;
            
            document.getElementById('uploadForm').reset();
            
            setTimeout(() => {
                switchTab('reports');
                document.querySelector('[onclick="switchTab(\'reports\')"]').click();
            }, 3000);
        } else {
            resultDiv.className = 'alert alert-error';
            resultDiv.innerHTML = `<strong>Fehler:</strong> ${data.error}`;
        }
    } catch (error) {
        progressDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        resultDiv.className = 'alert alert-error';
        resultDiv.innerHTML = `<strong>Fehler:</strong> ${error.message}`;
    }
});

window.onclick = function(event) {
    const modal = document.getElementById('addCustomerModal');
    if (event.target === modal) {
        closeAddCustomerModal();
    }
}

checkAuth().then(authenticated => {
    if (authenticated) {
        loadCustomers();
    }
});
