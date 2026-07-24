// Global variables
let currentPage = 'dashboard';
let patients = [];
let predictionTimer = null;
let predictionStartTime = null;
const API = "http://127.0.0.1:5000";

// ECG Variables
let ecgChart = null;
let ecgData = [];
let ecgUpdateInterval = null;
let ecgAmplitude = 1;
let ecgSpeed = 100;
let ecgReadings = [];
let ecgAlerts = [];

// Appointments Data
let appointments = JSON.parse(localStorage.getItem('heartcareAppointments')) || [];

// Cardiac Doctors Data
const cardiacDoctors = [
    {
        id: 1,
        name: "Dr. Sarah Johnson",
        specialty: "Cardiologist",
        experience: "15+ years",
        rating: "4.9",
        availability: "Mon-Fri, 9AM-5PM",
        bio: "Specializes in interventional cardiology and heart failure management.",
        avatar: '<i class="fas fa-user-md"></i>'
    },
    {
        id: 2,
        name: "Dr. Michael Chen",
        specialty: "Cardiac Surgeon",
        experience: "20+ years",
        rating: "4.8",
        availability: "Tue-Thu, 10AM-4PM",
        bio: "Expert in bypass surgery and valve replacements.",
        avatar: '<i class="fas fa-heartbeat"></i>'
    },
    {
        id: 3,
        name: "Dr. Priya Sharma",
        specialty: "Electrophysiologist",
        experience: "12+ years",
        rating: "4.7",
        availability: "Mon-Wed-Fri, 8AM-3PM",
        bio: "Specializes in arrhythmia treatment and pacemaker implantation.",
        avatar: '<i class="fas fa-heart"></i>'
    },
    {
        id: 4,
        name: "Dr. Robert Williams",
        specialty: "Preventive Cardiology",
        experience: "18+ years",
        rating: "4.9",
        availability: "Mon-Sat, 9AM-6PM",
        bio: "Focuses on heart disease prevention and lifestyle management.",
        avatar: '<i class="fas fa-stethoscope"></i>'
    }
];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('❤️ HeartCare AI Dashboard Initializing...');
    checkLoginStatus();
    initializeApp();
    loadDashboardData();
    setupEventListeners();
    updateTime();
    
    // Navigation fix - ensure all nav items are clickable
    setTimeout(initializeNavigation, 500);
});

// Navigation fix function
function initializeNavigation() {
    console.log('🔗 Initializing navigation...');
    
    // Get all navigation items
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        // Ensure cursor pointer
        item.style.cursor = 'pointer';
        
        // Remove any existing click listeners
        const newItem = item.cloneNode(true);
        if (item.parentNode) {
            item.parentNode.replaceChild(newItem, item);
        }
        
        // Add click event to new element
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const page = this.getAttribute('data-page');
            if (page) {
                console.log(`📱 Navigation clicked: ${page}`);
                showPage(page);
            }
        });
    });
    
    console.log(`✅ Navigation initialized with ${navItems.length} items`);
}

// Check if user is logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentUser = localStorage.getItem('currentUser');
    
    console.log('🔐 Checking login status...');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        console.log('❌ Not logged in, redirecting to login page');
        window.location.href = 'login.html';
        return;
    }

    // Update user info
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = user.name;
                console.log('✅ User loaded:', user.name);
            }
        } catch (e) {
            console.error('❌ Error parsing user data:', e);
        }
    }
}

// Initialize the application
function initializeApp() {
    console.log('🔄 Initializing app...');
    
    // Load patients data
    loadPatients();
    
    // Initialize charts
    initializeCharts();
    
    // Initialize ECG
    initializeECGChart();
}

// Setup event listeners
function setupEventListeners() {
    console.log('🎮 Setting up event listeners...');
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('👋 Logging out...');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            window.location.href = '/login.html';
        });
    }

    // Prediction form
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm) {
        predictionForm.addEventListener('submit', handlePrediction);
    }

    // Add patient button
    const addPatientBtn = document.getElementById('addPatientBtn');
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', showAddPatientModal);
    }

    // Add patient form
    const addPatientForm = document.getElementById('addPatientForm');
    if (addPatientForm) {
        addPatientForm.addEventListener('submit', handleAddPatient);
    }

    // Search functionality
    const patientSearch = document.getElementById('patientSearch');
    if (patientSearch) {
        patientSearch.addEventListener('input', filterPatients);
    }

    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // ECG Control Buttons
    const startECGBtn = document.getElementById('startECGBtn');
    if (startECGBtn) {
        startECGBtn.addEventListener('click', startLiveECG);
    }

    const stopECGBtn = document.getElementById('stopECGBtn');
    if (stopECGBtn) {
        stopECGBtn.addEventListener('click', stopLiveECG);
    }

    // ECG Controls
    const amplitudeSlider = document.getElementById('ecgAmplitude');
    if (amplitudeSlider) {
        amplitudeSlider.addEventListener('input', (e) => {
            ecgAmplitude = parseFloat(e.target.value);
            console.log(`📈 ECG amplitude set to: ${ecgAmplitude}x`);
        });
    }

    const speedSlider = document.getElementById('ecgSpeed');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            ecgSpeed = parseInt(e.target.value);
            console.log(`⚡ ECG speed set to: ${ecgSpeed}ms`);
            if (ecgUpdateInterval) {
                stopLiveECG();
                setTimeout(() => startLiveECG(), 100);
            }
        });
    }

    // Appointments
    const newAppointmentBtn = document.getElementById('newAppointmentBtn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', showBookAppointmentModal);
    }

    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentBooking);
    }
}

// Update current time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
    
    setTimeout(updateTime, 1000);
}

// Show specific page
function showPage(pageName) {
    console.log(`📱 Showing page: ${pageName}`);
    
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Activate corresponding nav item
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = getPageTitle(pageName);
    }

    // Load page-specific data
    switch(pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'patients':
            loadPatientsTable();
            break;
        case 'prediction':
            resetPredictionForm();
            break;
        case 'monitoring':
            if (!ecgChart) initializeECGChart();
            updateECGStatus('READY');
            break;
        case 'analytics':
            initializeAnalyticsCharts();
            break;
        case 'appointments':
            initializeAppointmentsPage();
            break;
    }

    // Stop ECG when leaving monitoring page
    if (currentPage === 'monitoring' && pageName !== 'monitoring') {
        stopLiveECG();
    }
    
    currentPage = pageName;
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Get page title
function getPageTitle(pageName) {
    const titles = {
        'dashboard': 'Dashboard',
        'prediction': 'AI Prediction',
        'patients': 'Cardiac Patients',
        'monitoring': 'Heart Monitoring',
        'analytics': 'Analytics',
        'appointments': 'Appointments'
    };
    return titles[pageName] || 'Dashboard';
}

// Load dashboard data
async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    try {
        const response = await fetch(`${API}/api/dashboard/stats`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Dashboard data loaded:', data);
        
        // Update stats
        document.getElementById('totalPatients').textContent = data.total_patients;
        document.getElementById('highRiskPatients').textContent = data.high_risk_patients;
        document.getElementById('totalPredictions').textContent = data.total_predictions;
        document.getElementById('interventionsCount').textContent = data.interventions;
        
        // Update trend chart
        updateTrendChart(data.monthly_data);
        
        // Load recent alerts
        loadRecentAlerts();
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        // Fallback to mock data
        document.getElementById('totalPatients').textContent = '142';
        document.getElementById('highRiskPatients').textContent = '23';
        document.getElementById('totalPredictions').textContent = '327';
        document.getElementById('interventionsCount').textContent = '89';
    }
}

// Load patients data
async function loadPatients() {
    console.log('👥 Loading patients data...');
    try {
        const response = await fetch(`${API}/api/patients`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        patients = await response.json();
        console.log(`✅ Loaded ${patients.length} patients`);
        loadPatientsTable();
    } catch (error) {
        console.error('❌ Error loading patients:', error);
        patients = [];
    }
}

// Load patients table
function loadPatientsTable() {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (patients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 15px; display: block; color: #ddd;"></i>
                    No patients found. Add your first patient!
                </td>
            </tr>
        `;
        return;
    }
    
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        
        const riskClass = patient.risk_level?.toLowerCase() || 'low';
        
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-user"></i>
                    </div>
                    <span style="font-weight: 600;">${patient.name}</span>
                </div>
            </td>
            <td>${patient.age}</td>
            <td><span class="gender-badge">${patient.gender}</span></td>
            <td>
                <div class="heart-rate-indicator">
                    <i class="fas fa-heart" style="color: ${patient.heart_rate > 100 ? '#e74c3c' : patient.heart_rate > 80 ? '#f39c12' : '#27ae60'}"></i>
                    ${patient.heart_rate}
                </div>
            </td>
            <td>${patient.blood_pressure}</td>
            <td><span class="risk-badge ${riskClass}">${patient.risk_level}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-view" onclick="viewPatient(${patient.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-sm btn-edit" onclick="editPatient(${patient.id})" title="Edit Patient">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-download" onclick="downloadReport(${patient.id})" title="Download Report">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Filter patients
function filterPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const filteredPatients = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        (patient.condition && patient.condition.toLowerCase().includes(searchTerm)) ||
        (patient.risk_level && patient.risk_level.toLowerCase().includes(searchTerm))
    );
    
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; display: block; color: #ddd;"></i>
                    No patients match your search
                </td>
            </tr>
        `;
        return;
    }
    
    filteredPatients.forEach(patient => {
        const row = document.createElement('tr');
        const riskClass = patient.risk_level?.toLowerCase() || 'low';
        
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 35px; height: 35px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-user"></i>
                    </div>
                    <span style="font-weight: 600;">${patient.name}</span>
                </div>
            </td>
            <td>${patient.age}</td>
            <td><span class="gender-badge">${patient.gender}</span></td>
            <td>
                <div class="heart-rate-indicator">
                    <i class="fas fa-heart" style="color: ${patient.heart_rate > 100 ? '#e74c3c' : patient.heart_rate > 80 ? '#f39c12' : '#27ae60'}"></i>
                    ${patient.heart_rate}
                </div>
            </td>
            <td>${patient.blood_pressure}</td>
            <td><span class="risk-badge ${riskClass}">${patient.risk_level}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-view" onclick="viewPatient(${patient.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-sm btn-edit" onclick="editPatient(${patient.id})" title="Edit Patient">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-download" onclick="downloadReport(${patient.id})" title="Download Report">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Load recent alerts
function loadRecentAlerts() {
    const alertsGrid = document.getElementById('recentAlerts');
    if (!alertsGrid) return;
    
    // Get high risk patients
    const highRiskPatients = patients.filter(p => p.risk_level === 'High').slice(0, 3);
    
    if (highRiskPatients.length === 0) {
        alertsGrid.innerHTML = '<div class="no-alerts"><i class="fas fa-check-circle"></i> No high-risk alerts at this time</div>';
        return;
    }
    
    alertsGrid.innerHTML = '';
    
    highRiskPatients.forEach(patient => {
        const alertCard = document.createElement('div');
        alertCard.className = 'alert-card high';
        
        alertCard.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-info">
                <h4>${patient.name}</h4>
                <p>${patient.risk_score}% heart disease risk - ${patient.condition}</p>
                <span class="alert-time">Last checkup: ${patient.last_checkup}</span>
            </div>
            <button class="alert-action" onclick="viewPatient(${patient.id})">
                <i class="fas fa-arrow-right"></i>
            </button>
        `;
        
        alertsGrid.appendChild(alertCard);
    });
}

// Handle prediction form submission
async function handlePrediction(e) {
    e.preventDefault();
    console.log('🧠 Processing prediction request...');
    
    // Start timer
    startPredictionTimer();
    
    const formData = {
        age: parseInt(document.getElementById('predAge').value) || 0,
        gender: document.getElementById('predGender').value || '',
        chest_pain: document.getElementById('predChestPain').value || '',
        trestbps: parseInt(document.getElementById('predBP').value) || 120,
        chol: parseInt(document.getElementById('predChol').value) || 200,
        fbs: parseInt(document.getElementById('predFBS').value) || 0,
        restecg: parseInt(document.getElementById('predRestECG').value) || 0,
        thalach: parseInt(document.getElementById('predMaxHR').value) || 150,
        exang: parseInt(document.getElementById('predExang').value) || 0,
        oldpeak: parseFloat(document.getElementById('predOldpeak').value) || 0,
        slope: parseInt(document.getElementById('predSlope').value) || 1,
        ca: parseInt(document.getElementById('predCA').value) || 0,
        thal: parseInt(document.getElementById('predThal').value) || 3
    };
    
    console.log('📤 Sending prediction data:', formData);
    
    try {
        const response = await fetch(`${API}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        console.log('✅ Prediction result:', result);
        
        // Stop timer when prediction is complete
        stopPredictionTimer();
        displayPredictionResult(result);
        
    } catch (error) {
        console.error('❌ Prediction error:', error);
        stopPredictionTimer();
        displayPredictionResult({
            risk_score: 45,
            risk_level: 'Medium',
            condition: 'Network error - using demo data',
            recommendations: [
                'Please check your connection and try again',
                'Ensure backend server is running',
                'Contact system administrator if problem persists'
            ]
        });
    }
}

// Display prediction result
function displayPredictionResult(result) {
    const resultCard = document.getElementById('predictionResult');
    const resultContent = document.getElementById('resultContent');
    
    if (!resultCard || !resultContent) return;
    
    const riskClass = result.risk_level.toLowerCase();
    
    resultContent.innerHTML = `
        <div class="risk-indicator ${riskClass}">
            <div class="risk-score">${result.risk_score}%</div>
            <div class="risk-level">${result.risk_level} Risk</div>
        </div>
        <div class="risk-condition">
            <i class="fas fa-diagnoses"></i> ${result.condition}
        </div>
        <div class="recommendations">
            <h4><i class="fas fa-clipboard-list"></i> Recommendations:</h4>
            <ul>
                ${result.recommendations.map(rec => `<li><i class="fas fa-check-circle"></i> ${rec}</li>`).join('')}
            </ul>
        </div>
        <div class="prediction-actions">
            <button class="btn-secondary" onclick="resetPredictionForm()">
                <i class="fas fa-redo"></i> New Prediction
            </button>
            <button class="btn-primary" onclick="addPredictionAsPatient()">
                <i class="fas fa-user-plus"></i> Add as Patient
            </button>
        </div>
    `;
    
    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth' });
}

// Reset prediction form
function resetPredictionForm() {
    const form = document.getElementById('predictionForm');
    if (form) form.reset();
    
    const resultCard = document.getElementById('predictionResult');
    if (resultCard) resultCard.style.display = 'none';
    
    // Reset timer
    stopPredictionTimer();
    const timerElement = document.getElementById('predTimer');
    if (timerElement) timerElement.textContent = '00:00:00';
}

// Prediction timer functions
function startPredictionTimer() {
    predictionStartTime = new Date();
    predictionTimer = setInterval(updatePredictionTimer, 1000);
    const timerElement = document.getElementById('predTimer');
    if (timerElement) timerElement.textContent = '00:00:00';
}

function stopPredictionTimer() {
    if (predictionTimer) {
        clearInterval(predictionTimer);
        predictionTimer = null;
    }
}

function updatePredictionTimer() {
    if (!predictionStartTime) return;
    
    const now = new Date();
    const diff = Math.floor((now - predictionStartTime) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    const timeString = 
        hours.toString().padStart(2, '0') + ':' +
        minutes.toString().padStart(2, '0') + ':' +
        seconds.toString().padStart(2, '0');
    
    const timerElement = document.getElementById('predTimer');
    if (timerElement) timerElement.textContent = timeString;
}

// Initialize all charts
function initializeCharts() {
    console.log('📈 Initializing charts...');
    
    // Trend Chart
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        window.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'High Risk Cases',
                        data: [12, 15, 18, 22, 19, 25],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3
                    },
                    {
                        label: 'Medium Risk Cases',
                        data: [25, 28, 30, 32, 35, 38],
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Cases'
                        }
                    }
                }
            }
        });
    }
}

// Initialize Analytics Charts
function initializeAnalyticsCharts() {
    console.log('📊 Initializing analytics charts...');
    
    // Risk Distribution Chart
    const riskCtx = document.getElementById('riskChart');
    if (riskCtx) {
        const riskData = {
            high: patients.filter(p => p.risk_level === 'High').length,
            medium: patients.filter(p => p.risk_level === 'Medium').length,
            low: patients.filter(p => p.risk_level === 'Low').length
        };

        new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['High Risk', 'Medium Risk', 'Low Risk'],
                datasets: [{
                    data: [riskData.high, riskData.medium, riskData.low],
                    backgroundColor: ['#e74c3c', '#f39c12', '#27ae60'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Risk Distribution'
                    }
                }
            }
        });
    }

    // Treatment Effectiveness Chart
    const treatmentCtx = document.getElementById('treatmentChart');
    if (treatmentCtx) {
        new Chart(treatmentCtx, {
            type: 'bar',
            data: {
                labels: ['Medication', 'Lifestyle', 'Surgery', 'Monitoring', 'Therapy'],
                datasets: [{
                    label: 'Success Rate (%)',
                    data: [85, 72, 92, 78, 65],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(241, 196, 15, 0.8)',
                        'rgba(230, 126, 34, 0.8)'
                    ],
                    borderColor: [
                        '#3498db',
                        '#2ecc71',
                        '#9b59b6',
                        '#f1c40f',
                        '#e67e22'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Success Rate (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Treatment Effectiveness'
                    }
                }
            }
        });
    }

    // Age Distribution Chart
    const ageCtx = document.getElementById('ageChart');
    if (ageCtx) {
        const ageRanges = {
            '20-30': patients.filter(p => p.age >= 20 && p.age <= 30).length,
            '31-40': patients.filter(p => p.age >= 31 && p.age <= 40).length,
            '41-50': patients.filter(p => p.age >= 41 && p.age <= 50).length,
            '51-60': patients.filter(p => p.age >= 51 && p.age <= 60).length,
            '61+': patients.filter(p => p.age > 60).length
        };

        new Chart(ageCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(ageRanges),
                datasets: [{
                    label: 'Number of Patients',
                    data: Object.values(ageRanges),
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    borderColor: '#3498db',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Patients'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Age Range'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Age Distribution'
                    }
                }
            }
        });
    }

    // Gender Analysis Chart
    const genderCtx = document.getElementById('genderChart');
    if (genderCtx) {
        const genderData = {
            male: patients.filter(p => p.gender === 'male').length,
            female: patients.filter(p => p.gender === 'female').length,
            other: patients.filter(p => !['male', 'female'].includes(p.gender)).length
        };

        new Chart(genderCtx, {
            type: 'pie',
            data: {
                labels: ['Male', 'Female', 'Other'],
                datasets: [{
                    data: [genderData.male, genderData.female, genderData.other],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(231, 76, 60, 0.8)',
                        'rgba(46, 204, 113, 0.8)'
                    ],
                    borderColor: [
                        '#3498db',
                        '#e74c3c',
                        '#2ecc71'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Gender Distribution'
                    }
                }
            }
        });
    }
}

// Update trend chart
function updateTrendChart(monthlyData) {
    if (window.trendChart && monthlyData) {
        window.trendChart.data.datasets[0].data = monthlyData.map(m => m.high_risk);
        window.trendChart.data.datasets[1].data = monthlyData.map(m => m.medium_risk);
        window.trendChart.update();
    }
}

// Patient management functions
function viewPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        // Create a modal to show patient details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-injured"></i> Patient Details</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="patient-details">
                        <div class="detail-row">
                            <div class="detail-item">
                                <label>Name</label>
                                <div class="detail-value">${patient.name}</div>
                            </div>
                            <div class="detail-item">
                                <label>Age</label>
                                <div class="detail-value">${patient.age}</div>
                            </div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-item">
                                <label>Gender</label>
                                <div class="detail-value">${patient.gender}</div>
                            </div>
                            <div class="detail-item">
                                <label>Last Checkup</label>
                                <div class="detail-value">${patient.last_checkup}</div>
                            </div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-item">
                                <label>Heart Rate</label>
                                <div class="detail-value">${patient.heart_rate} bpm</div>
                            </div>
                            <div class="detail-item">
                                <label>Blood Pressure</label>
                                <div class="detail-value">${patient.blood_pressure}</div>
                            </div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-item">
                                <label>Cholesterol</label>
                                <div class="detail-value">${patient.cholesterol} mg/dl</div>
                            </div>
                            <div class="detail-item">
                                <label>Risk Score</label>
                                <div class="detail-value risk-badge ${patient.risk_level.toLowerCase()}">${patient.risk_score}%</div>
                            </div>
                        </div>
                        <div class="detail-row full">
                            <div class="detail-item">
                                <label>Condition</label>
                                <div class="detail-value">${patient.condition}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
                    <button class="btn-primary" onclick="downloadReport(${patient.id})">
                        <i class="fas fa-download"></i> Download Report
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function editPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        alert(`Edit patient: ${patient.name}\nThis feature would open an edit form in a complete implementation.`);
    }
}

// Show Add Patient Modal
function showAddPatientModal() {
    const modal = document.getElementById('addPatientModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('addPatientForm').reset();
        console.log('📝 Opening add patient modal');
    }
}

// Close Add Patient Modal
function closeAddPatientModal() {
    const modal = document.getElementById('addPatientModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('📝 Closing add patient modal');
    }
}

// Handle Add Patient Form Submission
async function handleAddPatient(e) {
    e.preventDefault();
    console.log('📝 Adding new patient...');
    
    const patientData = {
        name: document.getElementById('patientName').value.trim(),
        age: parseInt(document.getElementById('patientAge').value) || 0,
        gender: document.getElementById('patientGender').value || '',
        heart_rate: parseInt(document.getElementById('patientHeartRate').value) || 72,
        blood_pressure: document.getElementById('patientBP').value || "120/80",
        cholesterol: parseInt(document.getElementById('patientCholesterol').value) || 200,
        oldpeak: parseFloat(document.getElementById('patientOldpeak').value) || 0,
        chest_pain: document.getElementById('patientChestPain').value || ""
    };
    
    console.log('📤 Patient data:', patientData);
    
    // Validate 
        // Validate required fields
    if (!patientData.name || patientData.age <= 0) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Generate a new patient ID
    const newId = patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1;
    
    // Calculate risk score based on inputs
    let riskScore = 0;
    
    // Age factor
    if (patientData.age > 60) riskScore += 30;
    else if (patientData.age > 50) riskScore += 20;
    else if (patientData.age > 40) riskScore += 10;
    
    // Heart rate factor
    if (patientData.heart_rate > 100) riskScore += 20;
    else if (patientData.heart_rate > 90) riskScore += 10;
    
    // Blood pressure factor (simple parsing)
    const bpMatch = patientData.blood_pressure.match(/(\d+)\/(\d+)/);
    if (bpMatch) {
        const systolic = parseInt(bpMatch[1]);
        const diastolic = parseInt(bpMatch[2]);
        if (systolic > 140 || diastolic > 90) riskScore += 25;
        else if (systolic > 130 || diastolic > 85) riskScore += 15;
    }
    
    // Cholesterol factor
    if (patientData.cholesterol > 240) riskScore += 25;
    else if (patientData.cholesterol > 200) riskScore += 15;
    
    // Oldpeak factor
    if (patientData.oldpeak > 2) riskScore += 20;
    else if (patientData.oldpeak > 1) riskScore += 10;
    
    // Chest pain factor
    if (patientData.chest_pain === "yes") riskScore += 30;
    
    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);
    
    // Determine risk level
    let riskLevel = "Low";
    if (riskScore >= 70) riskLevel = "High";
    else if (riskScore >= 40) riskLevel = "Medium";
    
    // Create new patient object
    const newPatient = {
        id: newId,
        ...patientData,
        risk_score: riskScore,
        risk_level: riskLevel,
        condition: determineCondition(riskScore, patientData),
        last_checkup: new Date().toLocaleDateString(),
        created_at: new Date().toISOString()
    };
    
    console.log('✅ New patient created:', newPatient);
    
    try {
        // In a real app, you would send this to your backend API
        // For now, we'll add it to the local array
        patients.push(newPatient);
        
        // Update localStorage for persistence
        localStorage.setItem('heartcarePatients', JSON.stringify(patients));
        
        // Close modal
        closeAddPatientModal();
        
        // Refresh patients table
        loadPatientsTable();
        
        // Show success message
        showNotification(`Patient ${newPatient.name} added successfully!`, 'success');
        
    } catch (error) {
        console.error('❌ Error adding patient:', error);
        showNotification('Error adding patient. Please try again.', 'error');
    }
}

// Determine condition based on risk factors
function determineCondition(riskScore, patientData) {
    if (riskScore >= 70) {
        return "Severe Cardiac Risk - Requires Immediate Attention";
    } else if (riskScore >= 40) {
        return "Moderate Cardiac Risk - Regular Monitoring Required";
    } else {
        return "Stable - Regular Checkups Recommended";
    }
}

// Download patient report
function downloadReport(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
        alert('Patient not found!');
        return;
    }
    
    console.log(`📄 Downloading report for patient: ${patient.name}`);
    
    // Create report content
    const reportContent = `
        HEART CARE AI - PATIENT REPORT
        ================================
        Report Date: ${new Date().toLocaleString()}
        
        PATIENT INFORMATION
        -------------------
        Name: ${patient.name}
        Age: ${patient.age}
        Gender: ${patient.gender}
        Last Checkup: ${patient.last_checkup}
        
        VITAL STATISTICS
        -----------------
        Heart Rate: ${patient.heart_rate} bpm
        Blood Pressure: ${patient.blood_pressure}
        Cholesterol: ${patient.cholesterol} mg/dl
        Oldpeak: ${patient.oldpeak}
        
        RISK ASSESSMENT
        ----------------
        Risk Score: ${patient.risk_score}%
        Risk Level: ${patient.risk_level}
        Condition: ${patient.condition}
        
        RECOMMENDATIONS
        ----------------
        ${generateRecommendations(patient)}
        
        NOTES
        -----
        This report is generated by HeartCare AI System.
        For medical emergencies, please contact emergency services immediately.
        
        Generated by: HeartCare AI Dashboard
        © ${new Date().getFullYear()} HeartCare AI Systems
    `;
    
    // Create download link
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HeartCare_Report_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Report downloaded successfully');
}

// Generate recommendations based on patient data
function generateRecommendations(patient) {
    const recommendations = [];
    
    if (patient.risk_level === "High") {
        recommendations.push("Immediate cardiologist consultation required");
        recommendations.push("Consider hospitalization for close monitoring");
        recommendations.push("Emergency contact information should be readily available");
        recommendations.push("24/7 monitoring recommended");
    } else if (patient.risk_level === "Medium") {
        recommendations.push("Regular follow-up every 2 weeks");
        recommendations.push("Lifestyle modifications: diet and exercise");
        recommendations.push("Medication adherence monitoring");
        recommendations.push("Stress management techniques");
    } else {
        recommendations.push("Annual cardiac checkup");
        recommendations.push("Maintain healthy lifestyle");
        recommendations.push("Regular exercise (30 mins daily)");
        recommendations.push("Balanced diet with low sodium");
    }
    
    // Add specific recommendations based on vitals
    if (patient.heart_rate > 100) {
        recommendations.push("Monitor heart rate regularly");
    }
    
    const bpMatch = patient.blood_pressure.match(/(\d+)\/(\d+)/);
    if (bpMatch) {
        const systolic = parseInt(bpMatch[1]);
        if (systolic > 140) {
            recommendations.push("Blood pressure management required");
        }
    }
    
    if (patient.cholesterol > 200) {
        recommendations.push("Cholesterol-lowering diet recommended");
    }
    
    return recommendations.map(rec => `• ${rec}`).join('\n        ');
}

// Add prediction as new patient
function addPredictionAsPatient() {
    console.log('👤 Adding prediction as new patient...');
    
    // Get prediction form data
    const formData = {
        name: `Prediction_${new Date().getTime()}`,
        age: parseInt(document.getElementById('predAge').value) || 0,
        gender: document.getElementById('predGender').value || '',
        heart_rate: 72, // Default
        blood_pressure: "120/80", // Default
        cholesterol: parseInt(document.getElementById('predChol').value) || 200,
        oldpeak: parseFloat(document.getElementById('predOldpeak').value) || 0,
        chest_pain: document.getElementById('predChestPain').value || ""
    };
    
    // Pre-fill add patient form
    document.getElementById('patientName').value = formData.name;
    document.getElementById('patientAge').value = formData.age;
    document.getElementById('patientGender').value = formData.gender;
    document.getElementById('patientHeartRate').value = formData.heart_rate;
    document.getElementById('patientBP').value = formData.blood_pressure;
    document.getElementById('patientCholesterol').value = formData.cholesterol;
    document.getElementById('patientOldpeak').value = formData.oldpeak;
    document.getElementById('patientChestPain').value = formData.chest_pain;
    
    // Show add patient modal
    showAddPatientModal();
}

// Initialize ECG Chart
function initializeECGChart() {
    console.log('📈 Initializing ECG chart...');
    
    const ctx = document.getElementById('ecgChart');
    if (!ctx) return;
    
    // Clear existing chart if any
    if (ecgChart) {
        ecgChart.destroy();
    }
    
    // Reset data
    ecgData = [];
    ecgReadings = [];
    ecgAlerts = [];
    
    // Create new chart
    ecgChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'ECG Signal',
                data: ecgData,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 2,
                tension: 0,
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time (seconds)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Amplitude (mV)'
                    },
                    min: -2,
                    max: 2,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
    
    console.log('✅ ECG chart initialized');
    updateECGStatus('READY');
}

// Start Live ECG Monitoring
function startLiveECG() {
    console.log('▶️ Starting live ECG monitoring...');
    
    if (ecgUpdateInterval) {
        console.log('⚠️ ECG already running');
        return;
    }
    
    // Reset data
    ecgData = [];
    ecgReadings = [];
    const ecgLabels = [];
    
    // Generate initial ECG data
    const initialDataPoints = 100;
    for (let i = 0; i < initialDataPoints; i++) {
        ecgLabels.push((i / 10).toFixed(1));
        ecgData.push(generateECGPoint(i, ecgAmplitude));
    }
    
    // Update chart
    if (ecgChart) {
        ecgChart.data.labels = ecgLabels;
        ecgChart.data.datasets[0].data = ecgData;
        ecgChart.update('none');
    }
    
    // Start live updates
    let counter = initialDataPoints;
    ecgUpdateInterval = setInterval(() => {
        // Remove first point if we have too many
        if (ecgData.length > 200) {
            ecgData.shift();
            ecgLabels.shift();
        }
        
        // Add new point
        const newPoint = generateECGPoint(counter, ecgAmplitude);
        ecgData.push(newPoint);
        ecgLabels.push((counter / 10).toFixed(1));
        
        // Store reading for analysis
        ecgReadings.push({
            timestamp: new Date(),
            value: newPoint
        });
        
        // Check for abnormalities
        checkECGAbnormalities(newPoint, counter);
        
        // Update chart
        if (ecgChart) {
            ecgChart.data.labels = ecgLabels;
            ecgChart.data.datasets[0].data = ecgData;
            ecgChart.update('none');
        }
        
        counter++;
        
        // Update readings display
        updateECGReadingsDisplay();
        
    }, ecgSpeed);
    
    // Update UI
    updateECGStatus('MONITORING');
    document.getElementById('startECGBtn').disabled = true;
    document.getElementById('stopECGBtn').disabled = false;
    
    console.log(`✅ Live ECG started at ${ecgSpeed}ms interval`);
}

// Stop Live ECG Monitoring
function stopLiveECG() {
    console.log('⏹️ Stopping live ECG monitoring...');
    
    if (ecgUpdateInterval) {
        clearInterval(ecgUpdateInterval);
        ecgUpdateInterval = null;
        
        // Update UI
        updateECGStatus('STOPPED');
        document.getElementById('startECGBtn').disabled = false;
        document.getElementById('stopECGBtn').disabled = true;
        
        console.log('✅ Live ECG stopped');
        
        // Generate summary report
        generateECGSummary();
    }
}

// Generate ECG data point
function generateECGPoint(index, amplitude) {
    const t = index / 10; // Time in seconds
    
    // Normal sinus rhythm with some variations
    let value = 0;
    
    // P wave
    const pWave = 0.25 * Math.sin(2 * Math.PI * t * 0.5) * Math.exp(-Math.pow(t % 1.2 - 0.1, 2) * 100);
    
    // QRS complex
    const qrsTime = t % 1.2;
    let qrsComplex = 0;
    if (qrsTime > 0.1 && qrsTime < 0.2) {
        qrsComplex = 1.2 * Math.sin(2 * Math.PI * (qrsTime - 0.1) * 10);
    }
    
    // T wave
    const tWave = 0.3 * Math.sin(2 * Math.PI * t * 0.3) * Math.exp(-Math.pow(t % 1.2 - 0.3, 2) * 50);
    
    // Combine waves
    value = (pWave + qrsComplex + tWave) * amplitude;
    
    // Add some random noise
    value += (Math.random() - 0.5) * 0.05;
    
    return value;
}

// Check for ECG abnormalities
function checkECGAbnormalities(value, index) {
    // Check for abnormal patterns
    const abnormalities = [];
    
    // Check for bradycardia (< 60 bpm) or tachycardia (> 100 bpm)
    const heartRate = 60 + Math.sin(index / 50) * 10 + (Math.random() * 20);
    
    if (heartRate < 55) {
        abnormalities.push({
            type: 'Bradycardia',
            severity: 'warning',
            message: `Low heart rate detected: ${Math.round(heartRate)} bpm`
        });
    }
    
    if (heartRate > 110) {
        abnormalities.push({
            type: 'Tachycardia',
            severity: 'danger',
            message: `High heart rate detected: ${Math.round(heartRate)} bpm`
        });
    }
    
    // Check for irregular rhythm
    if (Math.random() < 0.005) { // 0.5% chance per reading
        abnormalities.push({
            type: 'Arrhythmia',
            severity: 'danger',
            message: 'Irregular heartbeat detected'
        });
    }
    
    // Check for ST segment elevation (heart attack indicator)
    if (value > 1.5 && Math.random() < 0.001) { // 0.1% chance
        abnormalities.push({
            type: 'ST Elevation',
            severity: 'critical',
            message: 'Possible ST segment elevation detected'
        });
    }
    
    // Add abnormalities to alerts
    abnormalities.forEach(abnormality => {
        const alert = {
            ...abnormality,
            timestamp: new Date().toLocaleTimeString(),
            value: value
        };
        
        ecgAlerts.push(alert);
        
        // Display alert
        displayECGAlert(alert);
        
        // Update alerts list
        updateECGAlertsDisplay();
    });
}

// Display ECG alert
function displayECGAlert(alert) {
    console.log(`⚠️ ECG Alert: ${alert.type} - ${alert.message}`);
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `ecg-alert ${alert.severity}`;
    alertElement.innerHTML = `
        <div class="alert-header">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>${alert.type}</strong>
            <span class="alert-time">${alert.timestamp}</span>
        </div>
        <div class="alert-body">${alert.message}</div>
    `;
    
    // Add to alerts container
    const alertsContainer = document.getElementById('ecgAlerts');
    if (alertsContainer) {
        alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
        
        // Limit number of displayed alerts
        const maxAlerts = 10;
        while (alertsContainer.children.length > maxAlerts) {
            alertsContainer.removeChild(alertsContainer.lastChild);
        }
    }
}

// Update ECG readings display
function updateECGReadingsDisplay() {
    const readingsContainer = document.getElementById('ecgReadings');
    if (!readingsContainer || ecgReadings.length === 0) return;
    
    const latestReading = ecgReadings[ecgReadings.length - 1];
    const heartRate = Math.round(60 + Math.sin(ecgReadings.length / 50) * 10 + (Math.random() * 20));
    
    readingsContainer.innerHTML = `
        <div class="reading-item">
            <span class="reading-label">Current Reading:</span>
            <span class="reading-value">${latestReading.value.toFixed(3)} mV</span>
        </div>
        <div class="reading-item">
            <span class="reading-label">Heart Rate:</span>
            <span class="reading-value ${heartRate > 100 ? 'danger' : heartRate > 80 ? 'warning' : 'normal'}">
                ${heartRate} bpm
            </span>
        </div>
        <div class="reading-item">
            <span class="reading-label">Duration:</span>
            <span class="reading-value">${(ecgReadings.length / 10).toFixed(1)}s</span>
        </div>
        <div class="reading-item">
            <span class="reading-label">Alerts:</span>
            <span class="reading-value ${ecgAlerts.length > 0 ? 'danger' : 'normal'}">
                ${ecgAlerts.length}
            </span>
        </div>
    `;
}

// Update ECG alerts display
function updateECGAlertsDisplay() {
    const alertsContainer = document.getElementById('ecgAlerts');
    if (!alertsContainer) return;
    
    // This is handled in displayECGAlert function
    // We just need to update the count
    const alertCount = document.getElementById('ecgAlertCount');
    if (alertCount) {
        alertCount.textContent = ecgAlerts.length;
        alertCount.className = `alert-badge ${ecgAlerts.length > 0 ? 'danger' : ''}`;
    }
}

// Update ECG status
function updateECGStatus(status) {
    const statusElement = document.getElementById('ecgStatus');
    if (!statusElement) return;
    
    const statusMap = {
        'READY': { text: 'Ready to Monitor', color: '#27ae60' },
        'MONITORING': { text: 'Live Monitoring', color: '#3498db' },
        'STOPPED': { text: 'Monitoring Stopped', color: '#e74c3c' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: '#95a5a6' };
    
    statusElement.textContent = statusInfo.text;
    statusElement.style.color = statusInfo.color;
}

// Generate ECG summary report
function generateECGSummary() {
    if (ecgReadings.length === 0) return;
    
    console.log('📊 Generating ECG summary report...');
    
    const avgValue = ecgReadings.reduce((sum, r) => sum + r.value, 0) / ecgReadings.length;
    const maxValue = Math.max(...ecgReadings.map(r => r.value));
    const minValue = Math.min(...ecgReadings.map(r => r.value));
    
    const summaryDiv = document.getElementById('ecgSummary');
    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <h4><i class="fas fa-chart-line"></i> ECG Monitoring Summary</h4>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-label">Duration:</span>
                    <span class="stat-value">${(ecgReadings.length / 10).toFixed(1)} seconds</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Readings:</span>
                    <span class="stat-value">${ecgReadings.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Amplitude:</span>
                    <span class="stat-value">${avgValue.toFixed(3)} mV</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Peak Value:</span>
                    <span class="stat-value">${maxValue.toFixed(3)} mV</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Alerts Triggered:</span>
                    <span class="stat-value ${ecgAlerts.length > 0 ? 'danger' : 'normal'}">${ecgAlerts.length}</span>
                </div>
            </div>
            ${ecgAlerts.length > 0 ? `
                <div class="alerts-summary">
                    <h5><i class="fas fa-exclamation-triangle"></i> Detected Abnormalities:</h5>
                    <ul>
                        ${ecgAlerts.slice(-5).map(alert => `
                            <li>${alert.timestamp} - ${alert.type}: ${alert.message}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }
}

// Initialize Appointments Page
function initializeAppointmentsPage() {
    console.log('📅 Initializing appointments page...');
    
    // Load appointments from localStorage
    loadAppointments();
    
    // Display cardiac doctors
    displayCardiacDoctors();
}

// Load appointments
function loadAppointments() {
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList) return;
    
    appointments.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    
    if (appointments.length === 0) {
        appointmentsList.innerHTML = `
            <div class="no-appointments">
                <i class="fas fa-calendar-plus"></i>
                <h3>No Appointments Scheduled</h3>
                <p>Book your first appointment with a cardiac specialist</p>
            </div>
        `;
        return;
    }
    
    appointmentsList.innerHTML = appointments.map(appointment => `
        <div class="appointment-card">
            <div class="appointment-header">
                <div class="appointment-type ${appointment.type.toLowerCase()}">
                    <i class="fas fa-${getAppointmentIcon(appointment.type)}"></i>
                    ${appointment.type}
                </div>
                <div class="appointment-status ${appointment.status.toLowerCase()}">
                    ${appointment.status}
                </div>
            </div>
            <div class="appointment-body">
                <h4>${appointment.patientName}</h4>
                <p><i class="fas fa-user-md"></i> ${appointment.doctor}</p>
                <div class="appointment-details">
                    <div class="detail">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(appointment.date)}
                    </div>
                    <div class="detail">
                        <i class="fas fa-clock"></i>
                        ${appointment.time}
                    </div>
                    <div class="detail">
                        <i class="fas fa-stethoscope"></i>
                        ${appointment.reason}
                    </div>
                </div>
            </div>
            <div class="appointment-footer">
                <button class="btn-sm btn-secondary" onclick="cancelAppointment('${appointment.id}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="btn-sm btn-primary" onclick="viewAppointmentDetails('${appointment.id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        </div>
    `).join('');
}

// Display cardiac doctors
function displayCardiacDoctors() {
    const doctorsGrid = document.getElementById('cardiacDoctors');
    if (!doctorsGrid) return;
    
    doctorsGrid.innerHTML = cardiacDoctors.map(doctor => `
        <div class="doctor-card">
            <div class="doctor-avatar">
                ${doctor.avatar}
            </div>
            <div class="doctor-info">
                <h4>${doctor.name}</h4>
                <p class="doctor-specialty">${doctor.specialty}</p>
                <div class="doctor-details">
                    <div class="detail">
                        <i class="fas fa-star"></i>
                        ${doctor.rating}/5.0
                    </div>
                    <div class="detail">
                        <i class="fas fa-briefcase"></i>
                        ${doctor.experience}
                    </div>
                    <div class="detail">
                        <i class="fas fa-calendar-check"></i>
                        ${doctor.availability}
                    </div>
                </div>
                <p class="doctor-bio">${doctor.bio}</p>
                <div class="doctor-actions">
                    <button class="btn-sm btn-secondary" onclick="viewDoctorProfile(${doctor.id})">
                        <i class="fas fa-user"></i> Profile
                    </button>
                    <button class="btn-sm btn-primary" onclick="bookWithDoctor(${doctor.id})">
                        <i class="fas fa-calendar-plus"></i> Book
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show book appointment modal
function showBookAppointmentModal(doctorId = null) {
    const modal = document.getElementById('appointmentModal');
    if (!modal) return;
    
    // Pre-select doctor if provided
    if (doctorId) {
        const doctor = cardiacDoctors.find(d => d.id === doctorId);
        if (doctor) {
            document.getElementById('appointmentDoctor').value = doctor.name;
        }
    }
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').min = today;
    
    // Set default time to next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    document.getElementById('appointmentTime').value = nextHour.getHours().toString().padStart(2, '0') + ':00';
    
    modal.style.display = 'flex';
    console.log('📅 Opening appointment booking modal');
}

// Handle appointment booking
function handleAppointmentBooking(e) {
    e.preventDefault();
    console.log('📅 Booking appointment...');
    
    const appointmentData = {
        id: 'apt_' + Date.now(),
        patientName: document.getElementById('appointmentPatient').value.trim(),
        doctor: document.getElementById('appointmentDoctor').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        type: document.getElementById('appointmentType').value,
        reason: document.getElementById('appointmentReason').value,
        status: 'Scheduled',
        notes: document.getElementById('appointmentNotes').value || '',
        created: new Date().toISOString()
    };
    
    // Validate
    if (!appointmentData.patientName || !appointmentData.date || !appointmentData.time) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Add appointment
    appointments.push(appointmentData);
    
    // Save to localStorage
    localStorage.setItem('heartcareAppointments', JSON.stringify(appointments));
    
    // Close modal
    document.getElementById('appointmentModal').style.display = 'none';
    
    // Reset form
    e.target.reset();
    
    // Refresh appointments list
    loadAppointments();
    
    // Show confirmation
    showNotification(`Appointment booked with ${appointmentData.doctor} on ${formatDate(appointmentData.date)} at ${appointmentData.time}`, 'success');
    
    console.log('✅ Appointment booked:', appointmentData);
}

// View doctor profile
function viewDoctorProfile(doctorId) {
    const doctor = cardiacDoctors.find(d => d.id === doctorId);
    if (doctor) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-md"></i> Doctor Profile</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="doctor-profile">
                        <div class="doctor-avatar large">
                            ${doctor.avatar}
                        </div>
                        <div class="doctor-info">
                            <h2>${doctor.name}</h2>
                            <p class="specialty">${doctor.specialty}</p>
                            <div class="doctor-stats">
                                <div class="stat">
                                    <i class="fas fa-star"></i>
                                    <strong>${doctor.rating}</strong>
                                    <span>Rating</span>
                                </div>
                                <div class="stat">
                                    <i class="fas fa-briefcase"></i>
                                    <strong>${doctor.experience}</strong>
                                    <span>Experience</span>
                                </div>
                            </div>
                            <div class="doctor-details">
                                <h4>Availability</h4>
                                <p><i class="fas fa-clock"></i> ${doctor.availability}</p>
                                <h4>Specialization</h4>
                                <p>${doctor.bio}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Close
                    </button>
                    <button class="btn-primary" onclick="bookWithDoctor(${doctor.id})">
                        <i class="fas fa-calendar-plus"></i> Book Appointment
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Book with specific doctor
function bookWithDoctor(doctorId) {
    const doctor = cardiacDoctors.find(d => d.id === doctorId);
    if (doctor) {
        showBookAppointmentModal(doctorId);
    }
}

// Cancel appointment
function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        appointments = appointments.filter(apt => apt.id !== appointmentId);
        localStorage.setItem('heartcareAppointments', JSON.stringify(appointments));
        loadAppointments();
        showNotification('Appointment cancelled successfully', 'warning');
    }
}

// View appointment details
function viewAppointmentDetails(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-check"></i> Appointment Details</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="appointment-details-view">
                        <div class="detail-section">
                            <h4><i class="fas fa-user-injured"></i> Patient Information</h4>
                            <p><strong>Name:</strong> ${appointment.patientName}</p>
                        </div>
                        <div class="detail-section">
                            <h4><i class="fas fa-user-md"></i> Doctor Information</h4>
                            <p><strong>Doctor:</strong> ${appointment.doctor}</p>
                        </div>
                        <div class="detail-section">
                            <h4><i class="fas fa-calendar-alt"></i> Appointment Details</h4>
                            <p><strong>Date:</strong> ${formatDate(appointment.date)}</p>
                            <p><strong>Time:</strong> ${appointment.time}</p>
                            <p><strong>Type:</strong> ${appointment.type}</p>
                            <p><strong>Status:</strong> <span class="status-badge ${appointment.status.toLowerCase()}">${appointment.status}</span></p>
                        </div>
                        <div class="detail-section">
                            <h4><i class="fas fa-file-medical"></i> Reason for Visit</h4>
                            <p>${appointment.reason}</p>
                        </div>
                        ${appointment.notes ? `
                            <div class="detail-section">
                                <h4><i class="fas fa-sticky-note"></i> Additional Notes</h4>
                                <p>${appointment.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.remove()">
                        Close
                    </button>
                    <button class="btn-warning" onclick="cancelAppointment('${appointment.id}')">
                        <i class="fas fa-times"></i> Cancel Appointment
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getAppointmentIcon(type) {
    const icons = {
        'Consultation': 'comments',
        'Follow-up': 'redo',
        'Emergency': 'exclamation-triangle',
        'Check-up': 'stethoscope',
        'Surgery': 'procedures'
    };
    return icons[type] || 'calendar';
}

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    const container = document.getElementById('notifications');
    if (container) {
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    } else {
        // Fallback alert
        alert(message);
    }
}

// Initialize on load
console.log('✅ HeartCare AI Dashboard Initialized Successfully!');

// Make functions globally available
window.showPage = showPage;
window.viewPatient = viewPatient;
window.editPatient = editPatient;
window.downloadReport = downloadReport;
window.showAddPatientModal = showAddPatientModal;
window.closeAddPatientModal = closeAddPatientModal;
window.startLiveECG = startLiveECG;
window.stopLiveECG = stopLiveECG;
window.showBookAppointmentModal = showBookAppointmentModal;
window.viewDoctorProfile = viewDoctorProfile;
window.bookWithDoctor = bookWithDoctor;
window.cancelAppointment = cancelAppointment;
window.viewAppointmentDetails = viewAppointmentDetails;