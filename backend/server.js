/**
 * Main Server File
 * Mauritanian Students Union Website - Backend
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database initialization
const { initializeDatabase } = require('./models/database');

// Import routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const messagesRoutes = require('./routes/messages');
const pagesRoutes = require('./routes/pages');
const membershipsRoutes = require('./routes/memberships');

// Create Express app
const app = express();

// ======================
// MIDDLEWARE
// ======================

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'mauritania-union-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ======================
// STATIC FILES
// ======================

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

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
        res.sendFile(path.join(__dirname, '..', 'frontend', `${page}.html`));
    });
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
    const adminPage = req.path.replace('/admin/', '').replace('/admin', '');
    const htmlFile = adminPage ? `${adminPage}.html` : 'index.html';
    res.sendFile(path.join(__dirname, '..', 'admin', htmlFile), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ======================
// ERROR HANDLING
// ======================

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 3000;

// Initialize database then start server
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('  Mauritanian Students Union Website');
            console.log('='.repeat(50));
            console.log(`  Server running on: http://localhost:${PORT}`);
            console.log(`  Admin dashboard:   http://localhost:${PORT}/admin`);
            console.log('='.repeat(50));
            console.log('  Default admin credentials:');
            console.log('  Username: admin');
            console.log('  Password: admin123');
            console.log('  (Please change after first login!)');
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
