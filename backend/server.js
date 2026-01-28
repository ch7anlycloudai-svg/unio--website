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
const mediaRoutes = require('./routes/media');

// Create Express app
const app = express();

// ======================
// MIDDLEWARE
// ======================

// CORS configuration - in production, same-origin requests don't need CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (same-origin, mobile apps, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    secret: process.env.SESSION_SECRET || 'mauritania-union-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction, // Use secure cookies in production (HTTPS)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: isProduction ? 'strict' : 'lax'
    },
    proxy: isProduction // Trust the reverse proxy in production
}));

// Trust proxy in production (Hostinger uses reverse proxy)
if (isProduction) {
    app.set('trust proxy', 1);
}

// ======================
// STATIC FILES
// ======================

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ======================
// API ROUTES
// ======================

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/memberships', membershipsRoutes);
app.use('/api/media', mediaRoutes);

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
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
    const adminPage = req.path.replace('/admin/', '').replace('/admin', '');
    const htmlFile = adminPage ? `${adminPage}.html` : 'index.html';
    res.sendFile(path.join(__dirname, 'admin', htmlFile), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'admin', 'index.html'));
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
    console.error('Server Error:', err.stack || err);
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error';
    res.status(500).json({ success: false, message });
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 3000;

// Initialize database then start server
async function startServer() {
    try {
        console.log('Starting server...');
        console.log('Environment:', process.env.NODE_ENV || 'development');
        console.log('Working directory:', process.cwd());

        await initializeDatabase();
        console.log('Database initialized successfully');

        app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log('  Mauritanian Students Union Website');
            console.log('='.repeat(50));
            console.log(`  Server running on port: ${PORT}`);
            console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('='.repeat(50));
            if (process.env.NODE_ENV !== 'production') {
                console.log('  Default admin credentials:');
                console.log('  Username: admin');
                console.log('  Password: admin123');
                console.log('  (Please change after first login!)');
                console.log('='.repeat(50));
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error.stack || error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
