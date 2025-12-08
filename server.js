const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static files from frontend folder
const frontendPath = path.join(__dirname, 'frontend');
console.log(`📂 Serving static files from: ${frontendPath}`);

// Check if frontend folder exists
if (!fs.existsSync(frontendPath)) {
    console.error('❌ ERROR: frontend folder not found!');
    console.log('Creating frontend folder...');
    fs.mkdirSync(frontendPath, { recursive: true });
}

app.use(express.static(frontendPath));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`📡 Proxying to backend: ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(502).json({ 
            error: 'Backend server not running',
            message: 'Make sure to run: cd backend && python app.py'
        });
    }
}));

// Serve HTML files with explicit routes
app.get('/', (req, res) => {
    const loginPath = path.join(frontendPath, 'login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.status(404).send(`
            <h1>Login page not found!</h1>
            <p>Make sure login.html exists in frontend folder</p>
            <p>Current path: ${loginPath}</p>
        `);
    }
});

app.get('/login', (req, res) => {
    res.redirect('/login.html');
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.redirect('/index.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        frontend: 'running',
        timestamp: new Date().toISOString(),
        files: {
            login: fs.existsSync(path.join(frontendPath, 'login.html')),
            index: fs.existsSync(path.join(frontendPath, 'index.html')),
            css: fs.existsSync(path.join(frontendPath, 'styles.css')),
            js: fs.existsSync(path.join(frontendPath, 'script.js'))
        }
    });
});

// Debug endpoint to list files
app.get('/debug/files', (req, res) => {
    try {
        const files = fs.readdirSync(frontendPath);
        res.json({
            path: frontendPath,
            files: files
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Handle all other routes - serve index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 HEARTCARE AI SYSTEM STARTED');
    console.log('='.repeat(50));
    console.log(`📍 Frontend: http://localhost:${PORT}`);
    console.log(`📡 Backend:  http://localhost:5000`);
    console.log('='.repeat(50));
    
    // List available files
    console.log('\n📂 Available Files:');
    try {
        const files = fs.readdirSync(frontendPath);
        files.forEach(file => {
            console.log(`   📄 ${file}`);
        });
    } catch (err) {
        console.log(`   ❌ No files found in frontend folder`);
    }
    
    console.log('\n🔗 Quick Links:');
    console.log(`   Login:     http://localhost:${PORT}/login.html`);
    console.log(`   Dashboard: http://localhost:${PORT}/index.html`);
    console.log(`   Health:    http://localhost:${PORT}/health`);
    console.log(`   Debug:     http://localhost:${PORT}/debug/files`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Username: doctor');
    console.log('   Password: heart2024');
    
    console.log('\n⚠️  IMPORTANT: Make sure backend is running!');
    console.log('   Run in another terminal: cd backend && python app.py');
    console.log('='.repeat(50) + '\n');
});