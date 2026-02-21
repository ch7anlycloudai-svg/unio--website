/**
 * Database Configuration - MySQL (using mysql2)
 * This file sets up the database connection pool and creates all necessary tables
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// MySQL connection pool
let pool = null;

/**
 * Initialize the database
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || 'u666876119_abdo',
        user: process.env.DB_USER || 'u666876119_lightgreenlap',
        password: process.env.DB_PASSWORD || '',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
    };

    console.log('Connecting to MySQL:', dbConfig.host + ':' + dbConfig.port, 'database:', dbConfig.database, 'user:', dbConfig.user);

    pool = mysql.createPool(dbConfig);

    // Test connection
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database successfully');
    connection.release();

    // Create tables
    await createTables();

    console.log('Database initialized successfully!');
}

/**
 * Create all database tables
 */
async function createTables() {
    // Admin users table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // News table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS news (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(100) NOT NULL DEFAULT 'news',
            image_url TEXT,
            location VARCHAR(500),
            published TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Contact messages table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            subject VARCHAR(500) NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Page content table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS page_content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            page_name VARCHAR(100) NOT NULL,
            section_id VARCHAR(100) NOT NULL,
            section_title VARCHAR(500),
            content TEXT NOT NULL,
            content_type VARCHAR(50) DEFAULT 'text',
            display_order INT DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_page_section (page_name, section_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Membership applications table
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS memberships (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            university VARCHAR(500) NOT NULL,
            major VARCHAR(255) NOT NULL,
            academic_level VARCHAR(100) NOT NULL,
            wilaya VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Hero slides table (for homepage carousel)
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS hero_slides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(500),
            subtitle VARCHAR(500),
            image_url TEXT NOT NULL,
            link_url TEXT,
            link_text VARCHAR(255),
            display_order INT DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Specialties table (for programs page)
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS specialties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            name_ar VARCHAR(255) NOT NULL,
            icon VARCHAR(50) DEFAULT '📚',
            description TEXT,
            image_url TEXT,
            video_url TEXT,
            video_type VARCHAR(50) DEFAULT 'youtube',
            items TEXT,
            duration VARCHAR(100),
            display_order INT DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create default admin if not exists
    await createDefaultAdmin();

    // Initialize default specialties
    await initializeDefaultSpecialties();

    // Initialize default page content
    await initializeDefaultContent();
}

/**
 * Create default admin user
 */
async function createDefaultAdmin() {
    const [rows] = await pool.execute("SELECT id FROM admins WHERE username = 'admin'");

    if (rows.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        await pool.execute("INSERT INTO admins (username, password) VALUES (?, ?)", ['admin', hashedPassword]);
        console.log('Default admin created (username: admin, password: admin123)');
        console.log('IMPORTANT: Please change the password after first login!');
    }
}

/**
 * Initialize default specialties
 */
async function initializeDefaultSpecialties() {
    const [rows] = await pool.execute("SELECT id FROM specialties LIMIT 1");

    if (rows.length === 0) {
        const specialties = [
            {
                name: 'medical',
                name_ar: 'العلوم الطبية',
                icon: '🏥',
                description: 'تشمل تخصصات الطب العام وطب الأسنان والصيدلة والعلوم البيطرية',
                items: JSON.stringify(['الطب العام', 'طب الأسنان', 'الصيدلة', 'التمريض', 'العلوم البيطرية']),
                duration: '5-7 سنوات',
                display_order: 1
            },
            {
                name: 'engineering',
                name_ar: 'الهندسة والتقنية',
                icon: '⚙️',
                description: 'تخصصات هندسية متنوعة في أفضل الجامعات الجزائرية',
                items: JSON.stringify(['الهندسة المدنية', 'الهندسة الكهربائية', 'الهندسة الميكانيكية', 'هندسة الحاسوب', 'الهندسة المعمارية']),
                duration: '5 سنوات',
                display_order: 2
            },
            {
                name: 'science',
                name_ar: 'العلوم الطبيعية',
                icon: '🔬',
                description: 'العلوم الأساسية والتطبيقية',
                items: JSON.stringify(['الرياضيات', 'الفيزياء', 'الكيمياء', 'البيولوجيا', 'علوم الأرض', 'المحروقات']),
                duration: 'نظام LMD',
                display_order: 3
            },
            {
                name: 'humanities',
                name_ar: 'العلوم الإنسانية',
                icon: '📚',
                description: 'تخصصات الآداب والعلوم الإنسانية',
                items: JSON.stringify(['الأدب العربي', 'التاريخ', 'الفلسفة', 'علم النفس', 'علم الاجتماع']),
                duration: 'نظام LMD',
                display_order: 4
            },
            {
                name: 'law',
                name_ar: 'القانون والعلوم السياسية',
                icon: '⚖️',
                description: 'القانون والعلاقات الدولية',
                items: JSON.stringify(['القانون العام', 'القانون الخاص', 'العلوم السياسية', 'العلاقات الدولية']),
                duration: 'نظام LMD',
                display_order: 5
            },
            {
                name: 'economics',
                name_ar: 'الاقتصاد والتجارة',
                icon: '💼',
                description: 'العلوم الاقتصادية والتجارية وعلوم التسيير',
                items: JSON.stringify(['العلوم الاقتصادية', 'العلوم التجارية', 'علوم التسيير', 'المحاسبة والمالية']),
                duration: 'نظام LMD',
                display_order: 6
            }
        ];

        for (const spec of specialties) {
            await pool.execute(
                `INSERT INTO specialties (name, name_ar, icon, description, items, duration, display_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [spec.name, spec.name_ar, spec.icon, spec.description, spec.items, spec.duration, spec.display_order]
            );
        }

        console.log('Default specialties initialized!');
    }
}

/**
 * Initialize default page content
 */
async function initializeDefaultContent() {
    const [rows] = await pool.execute("SELECT id FROM page_content LIMIT 1");

    if (rows.length === 0) {
        const insertContent = async (page, section, title, content, type, order) => {
            await pool.execute(
                "INSERT IGNORE INTO page_content (page_name, section_id, section_title, content, content_type, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                [page, section, title, content, type, order]
            );
        };

        // HOME PAGE
        await insertContent('home', 'hero_title', 'Hero Title', 'اتحاد الطلبة الموريتانيين بالجزائر', 'text', 1);
        await insertContent('home', 'hero_subtitle', 'Hero Subtitle', 'معاً نحو التميز والنجاح في مسيرتنا الأكاديمية', 'text', 2);
        await insertContent('home', 'stats_students', 'Stats - Students', '500+', 'text', 3);
        await insertContent('home', 'stats_states', 'Stats - States', '15+', 'text', 4);
        await insertContent('home', 'stats_majors', 'Stats - Majors', '30+', 'text', 5);
        await insertContent('home', 'stats_years', 'Stats - Years', '10+', 'text', 6);
        await insertContent('home', 'about_preview_vision', 'Vision', 'أن نكون الجسر الذي يربط الطلبة الموريتانيين بفرص النجاح والتميز في الجزائر', 'text', 7);
        await insertContent('home', 'about_preview_mission', 'Mission', 'توفير الدعم الشامل للطلبة وتسهيل اندماجهم في الحياة الأكاديمية والاجتماعية', 'text', 8);
        await insertContent('home', 'about_preview_values', 'Values', 'نؤمن بالتضامن، التميز، الشفافية والعمل الجماعي كقيم أساسية', 'text', 9);
        await insertContent('home', 'cta_title', 'CTA Title', 'انضم إلى عائلة اتحاد الطلبة', 'text', 10);
        await insertContent('home', 'cta_text', 'CTA Text', 'سجل الآن واستفد من خدماتنا المتنوعة ودعمنا المستمر طوال مسيرتك الأكاديمية', 'text', 11);

        // ABOUT PAGE
        await insertContent('about', 'history_title', 'History Title', 'تاريخ الاتحاد', 'text', 1);
        await insertContent('about', 'history_content', 'History Content', 'تأسس اتحاد الطلبة الموريتانيين بالجزائر لخدمة الطلبة الموريتانيين الدارسين في الجزائر، ويسعى منذ تأسيسه إلى توفير بيئة داعمة تساعد الطلبة على التفوق الأكاديمي والاندماج في المجتمع الجزائري.', 'html', 2);
        await insertContent('about', 'vision_title', 'Vision Title', 'رؤيتنا', 'text', 3);
        await insertContent('about', 'vision_content', 'Vision Content', 'أن نكون المرجع الأول والأفضل للطلبة الموريتانيين في الجزائر، ونساهم في بناء جيل متميز من الكفاءات الوطنية.', 'html', 4);
        await insertContent('about', 'mission_title', 'Mission Title', 'مهمتنا', 'text', 5);
        await insertContent('about', 'mission_content', 'Mission Content', 'تقديم الدعم الشامل للطلبة الموريتانيين في جميع المجالات الأكاديمية والإدارية والاجتماعية.', 'html', 6);

        // GUIDE PAGE - Accordion Sections
        await insertContent('guide', 'intro_title', 'Guide Intro', 'دليل الطالب الشامل', 'text', 1);
        await insertContent('guide', 'intro_text', 'Guide Intro Text', 'كل ما تحتاج معرفته للحياة والدراسة في الجزائر', 'text', 2);

        // Bank Account Section
        await insertContent('guide', 'accordion_bank_title', 'عنوان قسم البنك', '🏦 فتح حساب بنكي', 'text', 3);
        await insertContent('guide', 'accordion_bank', 'محتوى قسم البنك', `<h4>الوثائق المطلوبة:</h4>
<ul>
    <li>جواز السفر ساري المفعول</li>
    <li>شهادة الإقامة أو عقد الإيجار</li>
    <li>شهادة التسجيل الجامعي</li>
    <li>صورتان شمسيتان</li>
    <li>نسخة من بطاقة الطالب</li>
</ul>

<h4>البنوك الموصى بها:</h4>
<ul>
    <li><strong>بريد الجزائر (CCP):</strong> الأسهل للفتح والأكثر انتشاراً</li>
    <li><strong>البنك الوطني الجزائري (BNA):</strong> خدمات جيدة للطلاب</li>
    <li><strong>بنك التنمية المحلية (BDL):</strong> فروع في معظم المدن</li>
</ul>

<div class="info-box info-box--warning">
    <p class="mb-0"><strong>نصيحة:</strong> حساب البريد (CCP) هو الأسرع في الفتح ويقبل التحويلات الدولية عبر Western Union.</p>
</div>`, 'html', 4);

        // Transportation Section
        await insertContent('guide', 'accordion_transport_title', 'عنوان قسم المواصلات', '🚌 المواصلات والتنقل', 'text', 5);
        await insertContent('guide', 'accordion_transport', 'محتوى قسم المواصلات', `<h4>وسائل النقل في المدن:</h4>
<ul>
    <li><strong>المترو:</strong> متوفر في الجزائر العاصمة (خطان)</li>
    <li><strong>الترامواي:</strong> متوفر في عدة مدن (الجزائر، وهران، قسنطينة)</li>
    <li><strong>الحافلات:</strong> شبكة واسعة تغطي معظم الأحياء</li>
    <li><strong>سيارات الأجرة:</strong> متوفرة بكثرة (تفاوض على السعر قبل الركوب)</li>
</ul>

<h4>التنقل بين الولايات:</h4>
<ul>
    <li><strong>الحافلات الكبيرة:</strong> وسيلة اقتصادية ومريحة (SNTV وشركات خاصة)</li>
    <li><strong>القطار:</strong> شبكة تربط المدن الرئيسية (SNTF)</li>
    <li><strong>الطائرة:</strong> للمسافات البعيدة (Air Algérie)</li>
</ul>

<h4>بطاقة النقل الجامعي:</h4>
<p>يمكنك الحصول على بطاقة نقل جامعي مخفضة من مصلحة النشاطات الجامعية. تتيح لك خصماً على وسائل النقل العام.</p>`, 'html', 6);

        // Housing Section
        await insertContent('guide', 'accordion_housing_title', 'عنوان قسم السكن', '🏠 السكن الجامعي', 'text', 7);
        await insertContent('guide', 'accordion_housing', 'محتوى قسم السكن', `<h4>أنواع السكن:</h4>

<h5>1. الإقامة الجامعية (الحي الجامعي):</h5>
<ul>
    <li>سكن مدعوم من الدولة</li>
    <li>يشمل عادة الوجبات</li>
    <li>رسوم رمزية جداً</li>
    <li>الأماكن محدودة - قدم طلبك مبكراً</li>
</ul>

<h5>2. السكن الخاص:</h5>
<ul>
    <li>غرف أو شقق للإيجار</li>
    <li>مرونة أكبر في الاختيار</li>
    <li>تكلفة أعلى من الإقامة الجامعية</li>
    <li>ابحث في المناطق القريبة من الجامعة</li>
</ul>

<h4>إجراءات الحصول على سكن جامعي:</h4>
<ol>
    <li>الحصول على شهادة التسجيل من الجامعة</li>
    <li>تقديم ملف كامل لإدارة الإقامة الجامعية</li>
    <li>انتظار الرد (قد يستغرق أسابيع)</li>
</ol>

<div class="info-box info-box--primary">
    <p class="mb-0"><strong>نصيحة:</strong> تواصل مع الاتحاد للحصول على معلومات عن السكن المتاح والتوصيات.</p>
</div>`, 'html', 8);

        // Documents Section
        await insertContent('guide', 'accordion_documents_title', 'عنوان قسم الوثائق', '📋 الوثائق المطلوبة', 'text', 9);
        await insertContent('guide', 'accordion_documents', 'محتوى قسم الوثائق', `<h4>الوثائق الأساسية:</h4>
<ul>
    <li>جواز السفر ساري المفعول (+ نسخ)</li>
    <li>شهادة البكالوريا مصدقة ومترجمة</li>
    <li>كشف النقاط مصدق ومترجم</li>
    <li>شهادة الميلاد مصدقة</li>
    <li>صور شمسية (10 صور على الأقل)</li>
    <li>شهادة طبية</li>
    <li>شهادة حسن السيرة والسلوك</li>
</ul>

<h4>للتسجيل الجامعي:</h4>
<ul>
    <li>استمارة التسجيل المسبق</li>
    <li>رسالة القبول من الجامعة</li>
    <li>إثبات الكفاءة اللغوية (إن وجد)</li>
    <li>شهادة المعادلة (إن طُلبت)</li>
</ul>

<h4>للإقامة:</h4>
<ul>
    <li>تأشيرة دخول سارية</li>
    <li>بطاقة الإقامة (تُستخرج بعد الوصول)</li>
</ul>

<div class="info-box info-box--warning">
    <p class="mb-0"><strong>مهم:</strong> احرص على تصديق جميع الوثائق من وزارة الخارجية الموريتانية والسفارة الجزائرية قبل السفر.</p>
</div>`, 'html', 10);

        // Daily Tips Section
        await insertContent('guide', 'accordion_tips_title', 'عنوان قسم النصائح', '💡 نصائح للحياة اليومية', 'text', 11);
        await insertContent('guide', 'accordion_tips', 'محتوى قسم النصائح', `<h4>الاتصالات:</h4>
<ul>
    <li>شركات الاتصال الرئيسية: Djezzy, Mobilis, Ooredoo</li>
    <li>يمكنك شراء شريحة بجواز السفر فقط</li>
    <li>عروض خاصة للطلاب متوفرة</li>
</ul>

<h4>التسوق والطعام:</h4>
<ul>
    <li>الأسواق الشعبية أرخص من المتاجر الكبرى</li>
    <li>المطاعم الجامعية توفر وجبات بأسعار مخفضة</li>
    <li>تتوفر منتجات حلال في كل مكان</li>
</ul>

<h4>الصحة:</h4>
<ul>
    <li>التأمين الصحي الجامعي يغطي الخدمات الأساسية</li>
    <li>المستشفيات الجامعية تقدم خدمات مجانية للطلاب</li>
    <li>احتفظ بنسخة من سجلك الطبي</li>
</ul>

<h4>نصائح عامة:</h4>
<ul>
    <li>تعلم بعض الكلمات بالدارجة الجزائرية</li>
    <li>احترم العادات والتقاليد المحلية</li>
    <li>احتفظ بنسخ من جميع وثائقك المهمة</li>
    <li>سجل رقم هاتف السفارة الموريتانية</li>
    <li>انضم لمجموعات الطلاب الموريتانيين على وسائل التواصل</li>
</ul>

<h4>أرقام مهمة:</h4>
<ul>
    <li>الطوارئ: 14</li>
    <li>الإسعاف: 14</li>
    <li>الشرطة: 17</li>
    <li>الحماية المدنية: 14</li>
</ul>`, 'html', 12);

        // Culture Section
        await insertContent('guide', 'accordion_culture_title', 'عنوان قسم الثقافة', '🌍 الثقافة والاندماج', 'text', 13);
        await insertContent('guide', 'accordion_culture', 'محتوى قسم الثقافة', `<h4>عن الجزائر:</h4>
<p>الجزائر بلد عربي إسلامي يتميز بتنوع ثقافي غني. الشعب الجزائري معروف بكرمه وحسن ضيافته، وستجد ترحيباً حاراً كطالب موريتاني.</p>

<h4>اللغة:</h4>
<ul>
    <li>اللغة الرسمية: العربية والأمازيغية</li>
    <li>اللغة الفرنسية مستخدمة بشكل واسع</li>
    <li>الدارجة الجزائرية هي لغة التواصل اليومي</li>
</ul>

<h4>نصائح للاندماج:</h4>
<ul>
    <li>شارك في الأنشطة الجامعية والطلابية</li>
    <li>تعرف على زملائك الجزائريين</li>
    <li>استكشف المدينة والأماكن السياحية</li>
    <li>شارك في فعاليات اتحاد الطلبة الموريتانيين</li>
    <li>كن منفتحاً على تجارب جديدة</li>
</ul>`, 'html', 14);

        // PROGRAMS PAGE
        await insertContent('programs', 'intro_title', 'Programs Intro', 'التخصصات الجامعية', 'text', 1);
        await insertContent('programs', 'intro_text', 'Programs Intro Text', 'استكشف التخصصات المتاحة للطلبة الموريتانيين في الجامعات الجزائرية', 'text', 2);

        // SERVICES PAGE - Service Cards
        await insertContent('services', 'intro_title', 'Services Intro', 'خدمات الاتحاد', 'text', 1);
        await insertContent('services', 'intro_text', 'Services Intro Text', 'نقدم مجموعة متنوعة من الخدمات لدعم الطلبة في جميع جوانب حياتهم الأكاديمية', 'text', 2);

        await insertContent('services', 'service_academic_icon', 'أيقونة الدعم الأكاديمي', '🎓', 'text', 3);
        await insertContent('services', 'service_academic_title', 'عنوان الدعم الأكاديمي', 'الدعم الأكاديمي', 'text', 4);
        await insertContent('services', 'service_academic', 'وصف الدعم الأكاديمي', 'توجيه ومساعدة في اختيار التخصص، والتسجيل، والإجراءات الإدارية الجامعية.', 'text', 5);

        await insertContent('services', 'service_admin_icon', 'أيقونة المساعدة الإدارية', '📄', 'text', 6);
        await insertContent('services', 'service_admin_title', 'عنوان المساعدة الإدارية', 'المساعدة الإدارية', 'text', 7);
        await insertContent('services', 'service_admin', 'وصف المساعدة الإدارية', 'مساعدة في استخراج الوثائق، والإقامة، والتعامل مع الجهات الرسمية.', 'text', 8);

        await insertContent('services', 'service_housing_icon', 'أيقونة استشارات السكن', '🏠', 'text', 9);
        await insertContent('services', 'service_housing_title', 'عنوان استشارات السكن', 'استشارات السكن', 'text', 10);
        await insertContent('services', 'service_housing', 'وصف استشارات السكن', 'معلومات ونصائح حول الإقامة الجامعية والسكن الخاص.', 'text', 11);

        await insertContent('services', 'service_network_icon', 'أيقونة التواصل والتشبيك', '🤝', 'text', 12);
        await insertContent('services', 'service_network_title', 'عنوان التواصل والتشبيك', 'التواصل والتشبيك', 'text', 13);
        await insertContent('services', 'service_network', 'وصف التواصل والتشبيك', 'ربط الطلاب الجدد بالقدامى وبناء شبكة دعم اجتماعي.', 'text', 14);

        await insertContent('services', 'service_advocacy_icon', 'أيقونة التمثيل والمناصرة', '📢', 'text', 15);
        await insertContent('services', 'service_advocacy_title', 'عنوان التمثيل والمناصرة', 'التمثيل والمناصرة', 'text', 16);
        await insertContent('services', 'service_advocacy', 'وصف التمثيل والمناصرة', 'تمثيل مصالح الطلبة الموريتانيين أمام الجهات الرسمية.', 'text', 17);

        await insertContent('services', 'service_activities_icon', 'أيقونة الأنشطة الثقافية', '🎉', 'text', 18);
        await insertContent('services', 'service_activities_title', 'عنوان الأنشطة الثقافية', 'الأنشطة الثقافية', 'text', 19);
        await insertContent('services', 'service_activities', 'وصف الأنشطة الثقافية', 'تنظيم فعاليات ثقافية واجتماعية ورحلات جماعية.', 'text', 20);

        // FAQ Items
        await insertContent('services', 'faq_1_question', 'السؤال الشائع 1', 'هل العضوية في الاتحاد مجانية؟', 'text', 21);
        await insertContent('services', 'faq_1', 'جواب السؤال 1', '<p>نعم، العضوية في اتحاد الطلبة الموريتانيين مجانية تماماً ومتاحة لجميع الطلبة الموريتانيين المسجلين في الجامعات والمعاهد الجزائرية.</p>', 'html', 22);

        await insertContent('services', 'faq_2_question', 'السؤال الشائع 2', 'ما هي مزايا العضوية؟', 'text', 23);
        await insertContent('services', 'faq_2', 'جواب السؤال 2', `<ul>
    <li>الدعم والتوجيه الأكاديمي</li>
    <li>المساعدة في الإجراءات الإدارية</li>
    <li>الوصول إلى شبكة الطلاب الموريتانيين</li>
    <li>المشاركة في الفعاليات والأنشطة</li>
    <li>التمثيل أمام الجهات الرسمية</li>
    <li>الحصول على آخر الأخبار والمستجدات</li>
</ul>`, 'html', 24);

        await insertContent('services', 'faq_3_question', 'السؤال الشائع 3', 'كيف يمكنني التواصل مع الاتحاد؟', 'text', 25);
        await insertContent('services', 'faq_3', 'جواب السؤال 3', `<p>يمكنك التواصل معنا من خلال:</p>
<ul>
    <li>البريد الإلكتروني: contact@uema-dz.org</li>
    <li>صفحتنا على فيسبوك</li>
    <li>نموذج الاتصال على الموقع</li>
    <li>الهاتف: +213 XX XX XX XX</li>
</ul>`, 'html', 26);

        await insertContent('services', 'faq_4_question', 'السؤال الشائع 4', 'هل يقدم الاتحاد مساعدات مالية؟', 'text', 27);
        await insertContent('services', 'faq_4', 'جواب السؤال 4', `<p>الاتحاد منظمة طلابية تطوعية ولا يملك ميزانية لتقديم مساعدات مالية مباشرة. لكننا نساعد في:</p>
<ul>
    <li>توجيه الطلاب للمنح المتاحة</li>
    <li>المساعدة في إجراءات طلب المنح</li>
    <li>ربط الطلاب بجهات الدعم الرسمية</li>
</ul>`, 'html', 28);

        await insertContent('services', 'faq_5_question', 'السؤال الشائع 5', 'كيف يمكنني المساهمة في أنشطة الاتحاد؟', 'text', 29);
        await insertContent('services', 'faq_5', 'جواب السؤال 5', `<p>نرحب بمساهمتك! يمكنك:</p>
<ul>
    <li>الانضمام للجان العمل المتخصصة</li>
    <li>المشاركة في تنظيم الفعاليات</li>
    <li>مساعدة الطلاب الجدد</li>
    <li>المساهمة بخبراتك ومهاراتك</li>
    <li>اقتراح أفكار ومبادرات جديدة</li>
</ul>`, 'html', 30);

        await insertContent('services', 'faq_6_question', 'السؤال الشائع 6', 'هل يمكن للخريجين البقاء أعضاء؟', 'text', 31);
        await insertContent('services', 'faq_6', 'جواب السؤال 6', '<p>نعم، نرحب بالخريجين كأعضاء شرفيين يمكنهم المساهمة بخبراتهم ومساعدة الطلاب الحاليين. العديد من خريجينا يواصلون دعم الاتحاد وتقديم النصح للطلاب.</p>', 'html', 32);

        // CONTACT PAGE
        await insertContent('contact', 'intro_title', 'Contact Intro', 'تواصل معنا', 'text', 1);
        await insertContent('contact', 'intro_text', 'Contact Intro Text', 'نحن هنا لمساعدتك. لا تتردد في التواصل معنا لأي استفسار', 'text', 2);
        await insertContent('contact', 'email', 'البريد الإلكتروني', 'contact@uema-dz.org', 'text', 3);
        await insertContent('contact', 'phone', 'الهاتف', '+213 XX XX XX XX', 'text', 4);
        await insertContent('contact', 'address', 'العنوان', 'الجزائر العاصمة، الجزائر', 'text', 5);
        await insertContent('contact', 'hours', 'ساعات العمل', 'السبت - الخميس: 9:00 - 17:00', 'text', 6);
        await insertContent('contact', 'emergency_info', 'معلومات الطوارئ', `<h4 class="info-box__title">للحالات الطارئة</h4>
<p class="mb-0">في حالات الطوارئ، يمكنك الاتصال مباشرة بـ:</p>
<ul class="mb-0">
    <li>السفارة الموريتانية: +213 XX XX XX XX</li>
    <li>الطوارئ الجزائرية: 14</li>
</ul>`, 'html', 7);

        console.log('Default page content initialized!');
    }
}

// ==========================================
// DATABASE HELPER FUNCTIONS (async API)
// ==========================================

const dbHelpers = {
    /**
     * Get one row
     */
    async get(sql, params = []) {
        const [rows] = await pool.execute(sql, params);
        return rows[0] || null;
    },

    /**
     * Get all rows
     */
    async all(sql, params = []) {
        const [rows] = await pool.execute(sql, params);
        return rows;
    },

    /**
     * Run a statement (INSERT, UPDATE, DELETE)
     */
    async run(sql, params = []) {
        const [result] = await pool.execute(sql, params);
        return {
            lastInsertRowid: result.insertId,
            changes: result.affectedRows
        };
    },

    /**
     * Execute raw SQL
     */
    async exec(sql) {
        await pool.execute(sql);
    }
};

module.exports = {
    initializeDatabase,
    db: dbHelpers
};
