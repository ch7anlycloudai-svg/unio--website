/**
 * Main Server File for Hostinger Deployment
 * Mauritanian Students Union Website
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Load environment variables
try {
    require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
} catch (e) {
    console.log('No .env file found, using defaults');
}

// Set production mode if not set
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

// Define paths
const BACKEND_DIR = path.join(__dirname, 'backend');
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const ADMIN_DIR = path.join(__dirname, 'backend', 'admin');

console.log('='.repeat(50));
console.log('Starting Mauritanian Students Union Website...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Backend dir:', BACKEND_DIR);
console.log('Frontend dir:', FRONTEND_DIR);
console.log('='.repeat(50));

// Import database - need to set the path before importing
process.env.DATABASE_PATH = process.env.DATABASE_PATH || path.join(BACKEND_DIR, 'data', 'database.sqlite');

const { initializeDatabase } = require('./backend/models/database');

// Import routes
const authRoutes = require('./backend/routes/auth');
const newsRoutes = require('./backend/routes/news');
const messagesRoutes = require('./backend/routes/messages');
const pagesRoutes = require('./backend/routes/pages');
const membershipsRoutes = require('./backend/routes/memberships');

// Create Express app
const app = express();

// ======================
// MIDDLEWARE
// ======================

// Trust proxy (Hostinger uses reverse proxy)
app.set('trust proxy', 1);

// CORS - allow all in production since same-origin
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'mauritania-union-secret-2024-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to false - Hostinger handles HTTPS at proxy level
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// ======================
// STATIC FILES
// ======================

app.use(express.static(FRONTEND_DIR));
app.use('/admin', express.static(ADMIN_DIR));

// ======================
// API ROUTES
// ======================

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/memberships', membershipsRoutes);

// ======================
// FRONTEND ROUTES
// ======================

const pages = ['about', 'news', 'guide', 'programs', 'services', 'contact'];

pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(FRONTEND_DIR, `${page}.html`));
    });
});

// Admin routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(ADMIN_DIR, 'index.html'));
});

app.get('/admin/*', (req, res) => {
    const adminPage = req.path.replace('/admin/', '').replace('/admin', '');
    const htmlFile = adminPage ? `${adminPage}.html` : 'index.html';
    res.sendFile(path.join(ADMIN_DIR, htmlFile), (err) => {
        if (err) {
            res.sendFile(path.join(ADMIN_DIR, 'index.html'));
        }
    });
});

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ======================
// ERROR HANDLING
// ======================

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');

        app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log(`Server running on port ${PORT}`);
            console.log('Website: http://localhost:' + PORT);
            console.log('Admin: http://localhost:' + PORT + '/admin');
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
