/**
 * Database Configuration - SQLite (using sql.js)
 * This file sets up the database and creates all necessary tables
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Database file path
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Global database instance
let db = null;

/**
 * Initialize the database
 * @returns {Promise<Database>}
 */
async function initializeDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
        console.log('Loaded existing database');
    } else {
        db = new SQL.Database();
        console.log('Created new database');
    }

    // Create tables
    createTables();

    // Save database to file
    saveDatabase();

    console.log('Database initialized successfully!');
    return db;
}

/**
 * Get database instance
 */
function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

/**
 * Save database to file
 */
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

/**
 * Create all database tables
 */
function createTables() {
    // Admin users table
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // News table
    db.run(`
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'news',
            image_url TEXT,
            location TEXT,
            published INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Contact messages table
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Page content table
    db.run(`
        CREATE TABLE IF NOT EXISTS page_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_name TEXT NOT NULL,
            section_id TEXT NOT NULL,
            section_title TEXT,
            content TEXT NOT NULL,
            content_type TEXT DEFAULT 'text',
            display_order INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(page_name, section_id)
        )
    `);

    // Membership applications table
    db.run(`
        CREATE TABLE IF NOT EXISTS memberships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            university TEXT NOT NULL,
            major TEXT NOT NULL,
            academic_level TEXT NOT NULL,
            wilaya TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create default admin if not exists
    createDefaultAdmin();

    // Initialize default page content
    initializeDefaultContent();
}

/**
 * Create default admin user
 */
function createDefaultAdmin() {
    const result = db.exec("SELECT id FROM admins WHERE username = 'admin'");

    if (result.length === 0 || result[0].values.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO admins (username, password) VALUES (?, ?)", ['admin', hashedPassword]);
        saveDatabase();
        console.log('Default admin created (username: admin, password: admin123)');
        console.log('IMPORTANT: Please change the password after first login!');
    }
}

/**
 * Initialize default page content
 */
function initializeDefaultContent() {
    const result = db.exec("SELECT id FROM page_content LIMIT 1");

    if (result.length === 0 || result[0].values.length === 0) {
        const insertContent = (page, section, title, content, type, order) => {
            db.run(
                "INSERT OR IGNORE INTO page_content (page_name, section_id, section_title, content, content_type, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                [page, section, title, content, type, order]
            );
        };

        // HOME PAGE
        insertContent('home', 'hero_title', 'Hero Title', 'اتحاد الطلبة الموريتانيين بالجزائر', 'text', 1);
        insertContent('home', 'hero_subtitle', 'Hero Subtitle', 'معاً نحو التميز والنجاح في مسيرتنا الأكاديمية', 'text', 2);
        insertContent('home', 'stats_students', 'Stats - Students', '500+', 'text', 3);
        insertContent('home', 'stats_states', 'Stats - States', '15+', 'text', 4);
        insertContent('home', 'stats_majors', 'Stats - Majors', '30+', 'text', 5);
        insertContent('home', 'stats_years', 'Stats - Years', '10+', 'text', 6);
        insertContent('home', 'about_preview_vision', 'Vision', 'أن نكون الجسر الذي يربط الطلبة الموريتانيين بفرص النجاح والتميز في الجزائر', 'text', 7);
        insertContent('home', 'about_preview_mission', 'Mission', 'توفير الدعم الشامل للطلبة وتسهيل اندماجهم في الحياة الأكاديمية والاجتماعية', 'text', 8);
        insertContent('home', 'about_preview_values', 'Values', 'نؤمن بالتضامن، التميز، الشفافية والعمل الجماعي كقيم أساسية', 'text', 9);
        insertContent('home', 'cta_title', 'CTA Title', 'انضم إلى عائلة اتحاد الطلبة', 'text', 10);
        insertContent('home', 'cta_text', 'CTA Text', 'سجل الآن واستفد من خدماتنا المتنوعة ودعمنا المستمر طوال مسيرتك الأكاديمية', 'text', 11);

        // ABOUT PAGE
        insertContent('about', 'history_title', 'History Title', 'تاريخ الاتحاد', 'text', 1);
        insertContent('about', 'history_content', 'History Content', 'تأسس اتحاد الطلبة الموريتانيين بالجزائر لخدمة الطلبة الموريتانيين الدارسين في الجزائر، ويسعى منذ تأسيسه إلى توفير بيئة داعمة تساعد الطلبة على التفوق الأكاديمي والاندماج في المجتمع الجزائري.', 'html', 2);
        insertContent('about', 'vision_title', 'Vision Title', 'رؤيتنا', 'text', 3);
        insertContent('about', 'vision_content', 'Vision Content', 'أن نكون المرجع الأول والأفضل للطلبة الموريتانيين في الجزائر، ونساهم في بناء جيل متميز من الكفاءات الوطنية.', 'html', 4);
        insertContent('about', 'mission_title', 'Mission Title', 'مهمتنا', 'text', 5);
        insertContent('about', 'mission_content', 'Mission Content', 'تقديم الدعم الشامل للطلبة الموريتانيين في جميع المجالات الأكاديمية والإدارية والاجتماعية.', 'html', 6);

        // GUIDE PAGE
        insertContent('guide', 'intro_title', 'Guide Intro', 'دليل الطالب الشامل', 'text', 1);
        insertContent('guide', 'intro_text', 'Guide Intro Text', 'كل ما تحتاج معرفته للحياة والدراسة في الجزائر', 'text', 2);
        insertContent('guide', 'bank_title', 'Bank Section Title', 'فتح حساب بنكي', 'text', 3);
        insertContent('guide', 'bank_content', 'Bank Section Content', 'الوثائق المطلوبة: جواز السفر، شهادة التسجيل، شهادة الإقامة، صورتان شمسيتان.', 'html', 4);

        // PROGRAMS PAGE
        insertContent('programs', 'intro_title', 'Programs Intro', 'التخصصات الجامعية', 'text', 1);
        insertContent('programs', 'intro_text', 'Programs Intro Text', 'استكشف التخصصات المتاحة للطلبة الموريتانيين في الجامعات الجزائرية', 'text', 2);

        // SERVICES PAGE
        insertContent('services', 'intro_title', 'Services Intro', 'خدمات الاتحاد', 'text', 1);
        insertContent('services', 'intro_text', 'Services Intro Text', 'نقدم مجموعة متنوعة من الخدمات لدعم الطلبة في جميع جوانب حياتهم الأكاديمية', 'text', 2);

        // CONTACT PAGE
        insertContent('contact', 'intro_title', 'Contact Intro', 'تواصل معنا', 'text', 1);
        insertContent('contact', 'intro_text', 'Contact Intro Text', 'نحن هنا لمساعدتك. لا تتردد في التواصل معنا لأي استفسار', 'text', 2);
        insertContent('contact', 'email', 'Email', 'contact@union-mauritanie.dz', 'text', 3);
        insertContent('contact', 'phone', 'Phone', '+213 XX XX XX XX', 'text', 4);
        insertContent('contact', 'address', 'Address', 'الجزائر العاصمة، الجزائر', 'text', 5);

        saveDatabase();
        console.log('Default page content initialized!');
    }
}

// ==========================================
// DATABASE HELPER FUNCTIONS (sync-like API)
// ==========================================

/**
 * Prepare and execute a statement
 */
const dbHelpers = {
    /**
     * Get one row
     */
    get(sql, params = []) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
        }
        stmt.free();
        return null;
    },

    /**
     * Get all rows
     */
    all(sql, params = []) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    },

    /**
     * Run a statement (INSERT, UPDATE, DELETE)
     */
    run(sql, params = []) {
        db.run(sql, params);
        saveDatabase();
        return {
            lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0,
            changes: db.getRowsModified()
        };
    },

    /**
     * Execute raw SQL
     */
    exec(sql) {
        db.exec(sql);
        saveDatabase();
    }
};

module.exports = {
    initializeDatabase,
    getDb,
    saveDatabase,
    db: dbHelpers
};
