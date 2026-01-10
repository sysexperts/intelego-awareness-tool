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
    } else if (tabName === 'settings') {
        loadEmailSettings();
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
        
        customersList.innerHTML = customers.map(customer => {
            // Erstelle Avatar-Initialen
            const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            // Erstelle Datum
            const createdDate = new Date(customer.created_at).toLocaleDateString('de-DE', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
            
            // Erstelle Details
            const details = [];
            if (customer.email) {
                details.push(`
                    <div class="customer-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span class="customer-detail-text">${customer.email}</span>
                    </div>
                `);
            }
            if (customer.phone) {
                details.push(`
                    <div class="customer-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span class="customer-detail-text">${customer.phone}</span>
                    </div>
                `);
            }
            if (customer.city) {
                details.push(`
                    <div class="customer-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span class="customer-detail-text">${customer.city}${customer.country ? ', ' + customer.country : ''}</span>
                    </div>
                `);
            }
            
            // Erstelle Anzeigename mit Kundennummer
            const displayName = customer.customer_number 
                ? `${customer.customer_number} - ${customer.name}`
                : customer.name;
            
            return `
                <div class="customer-card">
                    <div class="customer-header">
                        <div class="customer-avatar">${initials}</div>
                        <div class="customer-header-info">
                            <div class="customer-name">${displayName}</div>
                            <div class="customer-meta">
                                <span>Erstellt: ${createdDate}</span>
                                <span class="customer-badge">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                    Aktiv
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    ${details.length > 0 ? `
                        <div class="customer-info">
                            <div class="customer-details">${details.join('')}</div>
                        </div>
                    ` : ''}
                    
                    <div class="customer-footer">
                        <div class="customer-stats">
                            <div class="customer-stat">
                                <span class="customer-stat-label">DSGVO</span>
                                <span class="customer-stat-value">${customer.pdf_show_user_emails ? 'Voll' : 'Eingeschränkt'}</span>
                            </div>
                        </div>
                        <div class="customer-actions">
                            <button onclick="editCustomer(${customer.id})" class="btn-icon" title="Bearbeiten">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button onclick="deleteCustomer(${customer.id})" class="btn-icon btn-danger" title="Löschen">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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

let allReports = [];

async function loadReports() {
    try {
        const response = await fetch('/api/reports');
        allReports = await response.json();
        
        displayReports(allReports);
        await loadCustomersForFilter();
        
        // Befülle Kunden-Dropdowns für Reports ohne Kunde
        setTimeout(() => populateCustomerDropdowns(), 100);
    } catch (error) {
        console.error('Fehler beim Laden der Reports:', error);
        document.getElementById('reportsList').innerHTML = '<p class="error-message">Fehler beim Laden der Reports</p>';
    }
}

async function loadCustomersForFilter() {
    try {
        const response = await fetch('/api/customers');
        const customers = await response.json();
        
        const filterSelect = document.getElementById('filterCustomer');
        filterSelect.innerHTML = '<option value="">Alle Kunden</option>' + 
            customers.map(c => `<option value="${c.id}">${c.customer_number ? c.customer_number + ' - ' : ''}${c.name}</option>`).join('');
    } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
    }
}

function displayReports(reportsToDisplay) {
    const reportsList = document.getElementById('reportsList');
    
    if (reportsToDisplay.length === 0) {
        reportsList.innerHTML = '<p class="empty-state">Keine Reports gefunden.</p>';
        return;
    }
    
    reportsList.innerHTML = reportsToDisplay.map(report => {
        const riskClass = report.risk_level === 'Kritisch' ? 'risk-critical' : 
                         report.risk_level === 'Hoch' ? 'risk-high' : 
                         report.risk_level === 'Mittel' ? 'risk-medium' : 'risk-low';
        
        const uploadDate = new Date(report.upload_date + 'Z');
        const formattedDate = uploadDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const formattedTime = uploadDate.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const customerSection = report.customer_id 
            ? `<div class="report-customer-name">${report.customer_name}</div>`
            : `<div class="report-customer-assign">
                <select id="customerSelect-${report.id}" class="customer-select">
                    <option value="">⚠️ Kunde zuweisen...</option>
                </select>
                <button onclick="assignCustomer(${report.id})" class="btn btn-secondary btn-sm">Zuweisen</button>
               </div>`;
        
        const emailButton = report.customer_id && !report.email_sent
            ? `<button onclick="sendReportEmail(${report.id})" class="btn btn-success btn-sm">📧 E-Mail senden</button>`
            : '';
        
        return `
            <div class="report-card">
                <div class="report-header">
                    <div class="report-customer-info">
                        ${customerSection}
                        <div class="report-date">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formattedDate} um ${formattedTime}
                        </div>
                    </div>
                    <span class="risk-badge ${riskClass}">${report.risk_level}</span>
                </div>
                <div class="report-stats">
                    <div class="stat">
                        <span class="stat-label">Klickrate</span>
                        <span class="stat-value">${report.click_rate !== null ? report.click_rate + '%' : '0%'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Erfolgsquote</span>
                        <span class="stat-value">${report.success_rate !== null ? report.success_rate + '%' : '0%'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Szenarien</span>
                        <span class="stat-value">${report.total_scenarios || 0}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Benutzer</span>
                        <span class="stat-value">${report.total_users || 0}</span>
                    </div>
                </div>
                <div class="report-footer">
                    <div class="report-actions">
                        ${report.source === 'email' ? '<span class="badge-auto">🤖 Automatischer Report</span>' : '<span class="badge-manual">👤 Manueller Report</span>'}
                        ${report.email_sent ? '<span class="badge-success">✓ E-Mail versendet</span>' : ''}
                        ${emailButton}
                        <a href="/api/reports/download/${report.id}" class="btn btn-primary btn-sm">PDF Download</a>
                        <button onclick="deleteReport(${report.id})" class="btn btn-danger btn-sm">🗑️ Löschen</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterReports() {
    const customerFilter = document.getElementById('filterCustomer').value;
    const dateFromFilter = document.getElementById('filterDateFrom').value;
    const dateToFilter = document.getElementById('filterDateTo').value;
    
    let filtered = allReports;
    
    // Filter nach Kunde
    if (customerFilter) {
        filtered = filtered.filter(report => report.customer_id == customerFilter);
    }
    
    // Filter nach Datum (Von)
    if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(report => {
            const reportDate = new Date(report.upload_date);
            reportDate.setHours(0, 0, 0, 0);
            return reportDate >= fromDate;
        });
    }
    
    // Filter nach Datum (Bis)
    if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(report => {
            const reportDate = new Date(report.upload_date);
            return reportDate <= toDate;
        });
    }
    
    displayReports(filtered);
}

function resetFilters() {
    document.getElementById('filterCustomer').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    displayReports(allReports);
}

// Modal Tab Switching
function switchModalTab(tabName) {
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Customer Modal Functions
function showAddCustomerModal() {
    document.getElementById('customerModalTitle').textContent = 'Neuer Kunde';
    document.getElementById('customerId').value = '';
    document.getElementById('customerForm').reset();
    document.getElementById('customerModal').classList.add('active');
    
    // Reset to first tab
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('.modal-tab').classList.add('active');
    document.getElementById('basicTab').classList.add('active');
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    document.getElementById('customerModalTitle').textContent = 'Kunde bearbeiten';
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerNumber').value = customer.customer_number || '';
    document.getElementById('customerName').value = customer.name || '';
    document.getElementById('customerDomain').value = customer.domain || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerCity').value = customer.city || '';
    document.getElementById('customerPostalCode').value = customer.postal_code || '';
    document.getElementById('customerCountry').value = customer.country || '';
    document.getElementById('pdfShowUserEmails').checked = customer.pdf_show_user_emails !== 0;
    document.getElementById('pdfShowUserNames').checked = customer.pdf_show_user_names !== 0;
    document.getElementById('pdfShowDetailedStats').checked = customer.pdf_show_detailed_stats !== 0;
    document.getElementById('customerNotes').value = customer.notes || '';
    
    document.getElementById('customerModal').classList.add('active');
    
    // Reset to first tab
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('.modal-tab').classList.add('active');
    document.getElementById('basicTab').classList.add('active');
}

function closeCustomerModal() {
    document.getElementById('customerModal').classList.remove('active');
    document.getElementById('customerForm').reset();
}

document.getElementById('customerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const customerId = document.getElementById('customerId').value;
    const customerData = {
        name: document.getElementById('customerName').value,
        customer_number: document.getElementById('customerNumber').value,
        domain: document.getElementById('customerDomain').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value,
        city: document.getElementById('customerCity').value,
        postal_code: document.getElementById('customerPostalCode').value,
        country: document.getElementById('customerCountry').value,
        pdf_show_user_emails: document.getElementById('pdfShowUserEmails').checked,
        pdf_show_user_names: document.getElementById('pdfShowUserNames').checked,
        pdf_show_detailed_stats: document.getElementById('pdfShowDetailedStats').checked,
        notes: document.getElementById('customerNotes').value
    };
    
    try {
        const url = customerId ? `/api/customers/${customerId}` : '/api/customers';
        const method = customerId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
            closeCustomerModal();
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
                <p style="margin-top: 10px;">Weiterleitung zu Reports...</p>
            `;
            
            document.getElementById('uploadForm').reset();
            
            // Automatische Weiterleitung zu Reports nach 2 Sekunden
            setTimeout(() => {
                // Remove active class from all nav items and content
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Add active class to reports nav and content
                document.querySelectorAll('.nav-item')[2].classList.add('active'); // Reports ist der 3. Tab
                document.getElementById('reportsTab').classList.add('active');
                
                // Load reports
                loadReports();
            }, 2000);
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

// Assign customer to report
async function assignCustomer(reportId) {
    const selectElement = document.getElementById(`customerSelect-${reportId}`);
    const customerId = selectElement.value;
    
    if (!customerId) {
        alert('Bitte wählen Sie einen Kunden aus');
        return;
    }
    
    try {
        const response = await fetch(`/api/reports/${reportId}/assign-customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✓ Kunde erfolgreich zugewiesen!');
            loadReports();
        } else {
            alert('Fehler: ' + data.error);
        }
    } catch (error) {
        alert('Fehler beim Zuweisen des Kunden: ' + error.message);
    }
}

// Send report email
async function sendReportEmail(reportId) {
    if (!confirm('Report per E-Mail an support@intelego.net senden?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/reports/${reportId}/send-email`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✓ ' + data.message);
            loadReports();
        } else {
            alert('Fehler: ' + data.error);
        }
    } catch (error) {
        alert('Fehler beim E-Mail-Versand: ' + error.message);
    }
}

// Populate customer dropdowns in reports
async function populateCustomerDropdowns() {
    try {
        const response = await fetch('/api/customers');
        const customers = await response.json();
        
        document.querySelectorAll('.customer-select').forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">⚠️ Kunde zuweisen...</option>' + 
                customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            select.value = currentValue;
        });
    } catch (error) {
        console.error('Fehler beim Laden der Kunden für Dropdowns:', error);
    }
}

// Delete report
async function deleteReport(reportId) {
    if (!confirm('Möchten Sie diesen Report wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/reports/${reportId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✓ ' + data.message);
            loadReports();
        } else {
            alert('Fehler: ' + data.error);
        }
    } catch (error) {
        alert('Fehler beim Löschen des Reports: ' + error.message);
    }
}

// Manual email check
async function checkEmailsNow() {
    const btn = document.getElementById('checkEmailsBtn');
    const originalText = btn.innerHTML;
    
    // Disable button and show loading state
    btn.disabled = true;
    btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; animation: spin 1s linear infinite;">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Prüfe E-Mails...
    `;
    
    try {
        const response = await fetch('/api/email-check/check-now', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✓ ' + data.message);
            // Reload reports to show new ones
            loadReports();
        } else {
            alert('Fehler: ' + data.error + (data.details ? '\n' + data.details : ''));
        }
    } catch (error) {
        alert('Fehler beim Prüfen der E-Mails: ' + error.message);
    } finally {
        // Restore button
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

checkAuth().then(authenticated => {
    if (authenticated) {
        loadCustomers();
    }
});
