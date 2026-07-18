/**
 * Database Configuration - Supabase (PostgreSQL)
 * This file sets up the Supabase client and creates/seeds all necessary tables
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

let supabase = null;

/**
 * Initialize the database
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[DB Init] SUPABASE_URL type:', typeof supabaseUrl, '| length:', (supabaseUrl || '').length, '| falsy:', !supabaseUrl);
    console.log('[DB Init] SUPABASE_SERVICE_ROLE_KEY type:', typeof supabaseKey, '| length:', (supabaseKey || '').length, '| falsy:', !supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env. ' +
            'DEBUG: URL=' + (supabaseUrl ? 'present(' + supabaseUrl.length + ' chars)' : 'MISSING') +
            ', KEY=' + (supabaseKey ? 'present(' + supabaseKey.length + ' chars)' : 'MISSING')
        );
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // Auto-create tables via the initialize_schema() PostgreSQL function
    console.log('Running initialize_schema() to ensure all tables exist...');
    const { error: schemaError } = await supabase.rpc('initialize_schema');
    if (schemaError) {
        if (schemaError.message && schemaError.message.includes('function') && schemaError.message.includes('does not exist')) {
            console.error('initialize_schema() function not found in database.');
            console.error('Please run the SQL in backend/supabase-migration.sql in the Supabase SQL Editor once.');
            console.error('After that, tables will auto-create on every server restart.');
        }
        throw new Error('Schema initialization failed: ' + schemaError.message);
    }

    console.log('Connected to Supabase successfully — schema verified');

    // Seed default data
    try {
        await createDefaultAdmin();
    } catch (err) {
        console.error('Error seeding default admin:', err.message);
    }

    try {
        await initializeDefaultSpecialties();
    } catch (err) {
        console.error('Error seeding default specialties:', err.message);
    }

    try {
        await initializeDefaultContent();
    } catch (err) {
        console.error('Error seeding default page content:', err.message);
    }

    // Log seed results
    try {
        const { count: adminCount } = await supabase.from('admins').select('*', { count: 'exact', head: true });
        const { count: contentCount } = await supabase.from('page_content').select('*', { count: 'exact', head: true });
        const { count: specCount } = await supabase.from('specialties').select('*', { count: 'exact', head: true });
        console.log('Seed status: admins=' + adminCount + ', page_content=' + contentCount + ', specialties=' + specCount);
    } catch (err) {
        console.error('Could not check seed status:', err.message);
    }

    console.log('Database initialized successfully!');
}

/**
 * Create default admin user
 */
async function createDefaultAdmin() {
    const { data: existing } = await supabase
        .from('admins')
        .select('id')
        .eq('username', 'admin')
        .limit(1);

    if (!existing || existing.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        const { error } = await supabase
            .from('admins')
            .insert({ username: 'admin', password: hashedPassword });
        if (error) throw error;
        console.log('Default admin created (username: admin, password: admin123)');
        console.log('IMPORTANT: Please change the password after first login!');
    }
}

/**
 * Initialize default specialties
 */
async function initializeDefaultSpecialties() {
    const { data: existing } = await supabase
        .from('specialties')
        .select('id')
        .limit(1);

    if (!existing || existing.length === 0) {
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

        const { error } = await supabase.from('specialties').insert(specialties);
        if (error) throw error;
        console.log('Default specialties initialized!');
    }
}

/**
 * Initialize default page content
 */
async function initializeDefaultContent() {
    const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .limit(1);

    if (!existing || existing.length === 0) {
        console.log('Seeding default page content...');

        const rows = [];
        const add = (page, section, title, content, type, order) => {
            rows.push({
                page_name: page,
                section_id: section,
                section_title: title,
                content: content,
                content_type: type,
                display_order: order
            });
        };

        // HOME PAGE
        add('home', 'hero_title', 'Hero Title', 'اتحاد الطلبة الموريتانيين بالجزائر', 'text', 1);
        add('home', 'hero_subtitle', 'Hero Subtitle', 'معاً نحو التميز والنجاح في مسيرتنا الأكاديمية', 'text', 2);
        add('home', 'stats_students', 'Stats - Students', '500+', 'text', 3);
        add('home', 'stats_states', 'Stats - States', '15+', 'text', 4);
        add('home', 'stats_majors', 'Stats - Majors', '30+', 'text', 5);
        add('home', 'stats_years', 'Stats - Years', '10+', 'text', 6);
        add('home', 'about_preview_vision', 'Vision', 'أن نكون الجسر الذي يربط الطلبة الموريتانيين بفرص النجاح والتميز في الجزائر', 'text', 7);
        add('home', 'about_preview_mission', 'Mission', 'توفير الدعم الشامل للطلبة وتسهيل اندماجهم في الحياة الأكاديمية والاجتماعية', 'text', 8);
        add('home', 'about_preview_values', 'Values', 'نؤمن بالتضامن، التميز، الشفافية والعمل الجماعي كقيم أساسية', 'text', 9);
        add('home', 'cta_title', 'CTA Title', 'انضم إلى عائلة اتحاد الطلبة', 'text', 10);
        add('home', 'cta_text', 'CTA Text', 'سجل الآن واستفد من خدماتنا المتنوعة ودعمنا المستمر طوال مسيرتك الأكاديمية', 'text', 11);

        // ABOUT PAGE
        add('about', 'history_title', 'History Title', 'تاريخ الاتحاد', 'text', 1);
        add('about', 'history_content', 'History Content', 'تأسس اتحاد الطلبة الموريتانيين بالجزائر لخدمة الطلبة الموريتانيين الدارسين في الجزائر، ويسعى منذ تأسيسه إلى توفير بيئة داعمة تساعد الطلبة على التفوق الأكاديمي والاندماج في المجتمع الجزائري.', 'html', 2);
        add('about', 'vision_title', 'Vision Title', 'رؤيتنا', 'text', 3);
        add('about', 'vision_content', 'Vision Content', 'أن نكون المرجع الأول والأفضل للطلبة الموريتانيين في الجزائر، ونساهم في بناء جيل متميز من الكفاءات الوطنية.', 'html', 4);
        add('about', 'mission_title', 'Mission Title', 'مهمتنا', 'text', 5);
        add('about', 'mission_content', 'Mission Content', 'تقديم الدعم الشامل للطلبة الموريتانيين في جميع المجالات الأكاديمية والإدارية والاجتماعية.', 'html', 6);

        // GUIDE PAGE
        add('guide', 'intro_title', 'Guide Intro', 'دليل الطالب الشامل', 'text', 1);
        add('guide', 'intro_text', 'Guide Intro Text', 'كل ما تحتاج معرفته للحياة والدراسة في الجزائر', 'text', 2);
        add('guide', 'accordion_bank_title', 'عنوان قسم البنك', '🏦 فتح حساب بنكي', 'text', 3);
        add('guide', 'accordion_bank', 'محتوى قسم البنك', `<h4>الوثائق المطلوبة:</h4>
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
        add('guide', 'accordion_transport_title', 'عنوان قسم المواصلات', '🚌 المواصلات والتنقل', 'text', 5);
        add('guide', 'accordion_transport', 'محتوى قسم المواصلات', `<h4>وسائل النقل في المدن:</h4>
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
        add('guide', 'accordion_housing_title', 'عنوان قسم السكن', '🏠 السكن الجامعي', 'text', 7);
        add('guide', 'accordion_housing', 'محتوى قسم السكن', `<h4>أنواع السكن:</h4>

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
        add('guide', 'accordion_documents_title', 'عنوان قسم الوثائق', '📋 الوثائق المطلوبة', 'text', 9);
        add('guide', 'accordion_documents', 'محتوى قسم الوثائق', `<h4>الوثائق الأساسية:</h4>
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
        add('guide', 'accordion_tips_title', 'عنوان قسم النصائح', '💡 نصائح للحياة اليومية', 'text', 11);
        add('guide', 'accordion_tips', 'محتوى قسم النصائح', `<h4>الاتصالات:</h4>
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
        add('guide', 'accordion_culture_title', 'عنوان قسم الثقافة', '🌍 الثقافة والاندماج', 'text', 13);
        add('guide', 'accordion_culture', 'محتوى قسم الثقافة', `<h4>عن الجزائر:</h4>
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
        add('programs', 'intro_title', 'Programs Intro', 'التخصصات الجامعية', 'text', 1);
        add('programs', 'intro_text', 'Programs Intro Text', 'استكشف التخصصات المتاحة للطلبة الموريتانيين في الجامعات الجزائرية', 'text', 2);

        // SERVICES PAGE
        add('services', 'intro_title', 'Services Intro', 'خدمات الاتحاد', 'text', 1);
        add('services', 'intro_text', 'Services Intro Text', 'نقدم مجموعة متنوعة من الخدمات لدعم الطلبة في جميع جوانب حياتهم الأكاديمية', 'text', 2);
        add('services', 'service_academic_icon', 'أيقونة الدعم الأكاديمي', '🎓', 'text', 3);
        add('services', 'service_academic_title', 'عنوان الدعم الأكاديمي', 'الدعم الأكاديمي', 'text', 4);
        add('services', 'service_academic', 'وصف الدعم الأكاديمي', 'توجيه ومساعدة في اختيار التخصص، والتسجيل، والإجراءات الإدارية الجامعية.', 'text', 5);
        add('services', 'service_admin_icon', 'أيقونة المساعدة الإدارية', '📄', 'text', 6);
        add('services', 'service_admin_title', 'عنوان المساعدة الإدارية', 'المساعدة الإدارية', 'text', 7);
        add('services', 'service_admin', 'وصف المساعدة الإدارية', 'مساعدة في استخراج الوثائق، والإقامة، والتعامل مع الجهات الرسمية.', 'text', 8);
        add('services', 'service_housing_icon', 'أيقونة استشارات السكن', '🏠', 'text', 9);
        add('services', 'service_housing_title', 'عنوان استشارات السكن', 'استشارات السكن', 'text', 10);
        add('services', 'service_housing', 'وصف استشارات السكن', 'معلومات ونصائح حول الإقامة الجامعية والسكن الخاص.', 'text', 11);
        add('services', 'service_network_icon', 'أيقونة التواصل والتشبيك', '🤝', 'text', 12);
        add('services', 'service_network_title', 'عنوان التواصل والتشبيك', 'التواصل والتشبيك', 'text', 13);
        add('services', 'service_network', 'وصف التواصل والتشبيك', 'ربط الطلاب الجدد بالقدامى وبناء شبكة دعم اجتماعي.', 'text', 14);
        add('services', 'service_advocacy_icon', 'أيقونة التمثيل والمناصرة', '📢', 'text', 15);
        add('services', 'service_advocacy_title', 'عنوان التمثيل والمناصرة', 'التمثيل والمناصرة', 'text', 16);
        add('services', 'service_advocacy', 'وصف التمثيل والمناصرة', 'تمثيل مصالح الطلبة الموريتانيين أمام الجهات الرسمية.', 'text', 17);
        add('services', 'service_activities_icon', 'أيقونة الأنشطة الثقافية', '🎉', 'text', 18);
        add('services', 'service_activities_title', 'عنوان الأنشطة الثقافية', 'الأنشطة الثقافية', 'text', 19);
        add('services', 'service_activities', 'وصف الأنشطة الثقافية', 'تنظيم فعاليات ثقافية واجتماعية ورحلات جماعية.', 'text', 20);
        add('services', 'faq_1_question', 'السؤال الشائع 1', 'هل العضوية في الاتحاد مجانية؟', 'text', 21);
        add('services', 'faq_1', 'جواب السؤال 1', '<p>نعم، العضوية في اتحاد الطلبة الموريتانيين مجانية تماماً ومتاحة لجميع الطلبة الموريتانيين المسجلين في الجامعات والمعاهد الجزائرية.</p>', 'html', 22);
        add('services', 'faq_2_question', 'السؤال الشائع 2', 'ما هي مزايا العضوية؟', 'text', 23);
        add('services', 'faq_2', 'جواب السؤال 2', `<ul>
    <li>الدعم والتوجيه الأكاديمي</li>
    <li>المساعدة في الإجراءات الإدارية</li>
    <li>الوصول إلى شبكة الطلاب الموريتانيين</li>
    <li>المشاركة في الفعاليات والأنشطة</li>
    <li>التمثيل أمام الجهات الرسمية</li>
    <li>الحصول على آخر الأخبار والمستجدات</li>
</ul>`, 'html', 24);
        add('services', 'faq_3_question', 'السؤال الشائع 3', 'كيف يمكنني التواصل مع الاتحاد؟', 'text', 25);
        add('services', 'faq_3', 'جواب السؤال 3', `<p>يمكنك التواصل معنا من خلال:</p>
<ul>
    <li>البريد الإلكتروني: contact@uema-dz.org</li>
    <li>صفحتنا على فيسبوك</li>
    <li>نموذج الاتصال على الموقع</li>
    <li>الهاتف: +213 XX XX XX XX</li>
</ul>`, 'html', 26);
        add('services', 'faq_4_question', 'السؤال الشائع 4', 'هل يقدم الاتحاد مساعدات مالية؟', 'text', 27);
        add('services', 'faq_4', 'جواب السؤال 4', `<p>الاتحاد منظمة طلابية تطوعية ولا يملك ميزانية لتقديم مساعدات مالية مباشرة. لكننا نساعد في:</p>
<ul>
    <li>توجيه الطلاب للمنح المتاحة</li>
    <li>المساعدة في إجراءات طلب المنح</li>
    <li>ربط الطلاب بجهات الدعم الرسمية</li>
</ul>`, 'html', 28);
        add('services', 'faq_5_question', 'السؤال الشائع 5', 'كيف يمكنني المساهمة في أنشطة الاتحاد؟', 'text', 29);
        add('services', 'faq_5', 'جواب السؤال 5', `<p>نرحب بمساهمتك! يمكنك:</p>
<ul>
    <li>الانضمام للجان العمل المتخصصة</li>
    <li>المشاركة في تنظيم الفعاليات</li>
    <li>مساعدة الطلاب الجدد</li>
    <li>المساهمة بخبراتك ومهاراتك</li>
    <li>اقتراح أفكار ومبادرات جديدة</li>
</ul>`, 'html', 30);
        add('services', 'faq_6_question', 'السؤال الشائع 6', 'هل يمكن للخريجين البقاء أعضاء؟', 'text', 31);
        add('services', 'faq_6', 'جواب السؤال 6', '<p>نعم، نرحب بالخريجين كأعضاء شرفيين يمكنهم المساهمة بخبراتهم ومساعدة الطلاب الحاليين. العديد من خريجينا يواصلون دعم الاتحاد وتقديم النصح للطلاب.</p>', 'html', 32);

        // CONTACT PAGE
        add('contact', 'intro_title', 'Contact Intro', 'تواصل معنا', 'text', 1);
        add('contact', 'intro_text', 'Contact Intro Text', 'نحن هنا لمساعدتك. لا تتردد في التواصل معنا لأي استفسار', 'text', 2);
        add('contact', 'email', 'البريد الإلكتروني', 'contact@uema-dz.org', 'text', 3);
        add('contact', 'phone', 'الهاتف', '+213 XX XX XX XX', 'text', 4);
        add('contact', 'address', 'العنوان', 'الجزائر العاصمة، الجزائر', 'text', 5);
        add('contact', 'hours', 'ساعات العمل', 'السبت - الخميس: 9:00 - 17:00', 'text', 6);
        add('contact', 'emergency_info', 'معلومات الطوارئ', `<h4 class="info-box__title">للحالات الطارئة</h4>
<p class="mb-0">في حالات الطوارئ، يمكنك الاتصال مباشرة بـ:</p>
<ul class="mb-0">
    <li>السفارة الموريتانية: +213 XX XX XX XX</li>
    <li>الطوارئ الجزائرية: 14</li>
</ul>`, 'html', 7);

        // Insert in batches (Supabase has a limit on request size)
        const batchSize = 20;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const { error } = await supabase.from('page_content').insert(batch);
            if (error) throw error;
        }

        console.log('Default page content initialized!');
    }
}

// ==========================================
// DATABASE HELPER FUNCTIONS (Supabase API)
// ==========================================

function getClient() {
    if (!supabase) {
        throw new Error('Database not connected yet. Please try again in a moment.');
    }
    return supabase;
}

/**
 * Check seed status
 */
async function getSeedStatus() {
    if (!supabase) return { connected: false };
    try {
        const { count: admins } = await supabase.from('admins').select('*', { count: 'exact', head: true });
        const { count: content } = await supabase.from('page_content').select('*', { count: 'exact', head: true });
        const { count: specs } = await supabase.from('specialties').select('*', { count: 'exact', head: true });
        return { connected: true, admins, page_content: content, specialties: specs };
    } catch (err) {
        return { connected: false, error: err.message };
    }
}

/**
 * Force re-seed
 */
async function forceReseed() {
    if (!supabase) throw new Error('Database not connected.');
    await supabase.from('admins').delete().eq('username', 'admin');
    await supabase.from('page_content').delete().neq('id', 0);
    await supabase.from('specialties').delete().neq('id', 0);
    await createDefaultAdmin();
    await initializeDefaultSpecialties();
    await initializeDefaultContent();
    return await getSeedStatus();
}

module.exports = {
    initializeDatabase,
    getSeedStatus,
    forceReseed,
    getClient
};
