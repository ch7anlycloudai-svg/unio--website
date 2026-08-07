/**
 * Database Configuration - Supabase (PostgreSQL)
 * Arabic (ar) content architecture
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

let supabase = null;

async function initializeDatabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.'
        );
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Checking database schema...');
    await ensureTablesExist();
    console.log('Connected to Supabase successfully — schema verified');

    try {
        await ensureStorageBucket();
    } catch (err) {
        console.error('Storage bucket setup failed (non-fatal):', err.message);
    }

    try { await createDefaultAdmin(); } catch (err) { console.error('Error seeding default admin:', err.message); }
    try { await initializeDefaultSpecialties(); } catch (err) { console.error('Error seeding default specialties:', err.message); }
    try { await initializeDefaultContent(); } catch (err) { console.error('Error seeding default page content:', err.message); }
    try { await initializeDefaultSettings(); } catch (err) { console.error('Error seeding default settings:', err.message); }
    try { await initializeDefaultUniversities(); } catch (err) { console.error('Error seeding default universities:', err.message); }

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

async function initializeDefaultSpecialties() {
    const { data: existing } = await supabase
        .from('specialties')
        .select('id')
        .limit(1);

    if (!existing || existing.length === 0) {
        const specialties = [
            {
                slug: 'medical',
                name_ar: 'العلوم الطبية',
                icon: '\uD83C\uDFE5',
                description_ar: 'تشمل تخصصات الطب العام وطب الأسنان والصيدلة والعلوم البيطرية',
                items_ar: JSON.stringify(['الطب العام', 'طب الأسنان', 'الصيدلة', 'التمريض', 'العلوم البيطرية']),
                duration_ar: '5-7 سنوات',
                display_order: 1
            },
            {
                slug: 'engineering',
                name_ar: 'الهندسة والتقنية',
                icon: '\u2699\uFE0F',
                description_ar: 'تخصصات هندسية متنوعة في أفضل الجامعات الجزائرية',
                items_ar: JSON.stringify(['الهندسة المدنية', 'الهندسة الكهربائية', 'الهندسة الميكانيكية', 'هندسة الحاسوب', 'الهندسة المعمارية']),
                duration_ar: '5 سنوات',
                display_order: 2
            },
            {
                slug: 'science',
                name_ar: 'العلوم الطبيعية',
                icon: '\uD83D\uDD2C',
                description_ar: 'العلوم الأساسية والتطبيقية',
                items_ar: JSON.stringify(['الرياضيات', 'الفيزياء', 'الكيمياء', 'البيولوجيا', 'علوم الأرض', 'المحروقات']),
                duration_ar: 'نظام LMD',
                display_order: 3
            },
            {
                slug: 'humanities',
                name_ar: 'العلوم الإنسانية',
                icon: '\uD83D\uDCDA',
                description_ar: 'تخصصات الآداب والعلوم الإنسانية',
                items_ar: JSON.stringify(['الأدب العربي', 'التاريخ', 'الفلسفة', 'علم النفس', 'علم الاجتماع']),
                duration_ar: 'نظام LMD',
                display_order: 4
            },
            {
                slug: 'law',
                name_ar: 'القانون والعلوم السياسية',
                icon: '\u2696\uFE0F',
                description_ar: 'القانون والعلاقات الدولية',
                items_ar: JSON.stringify(['القانون العام', 'القانون الخاص', 'العلوم السياسية', 'العلاقات الدولية']),
                duration_ar: 'نظام LMD',
                display_order: 5
            },
            {
                slug: 'economics',
                name_ar: 'الاقتصاد والتجارة',
                icon: '\uD83D\uDCBC',
                description_ar: 'العلوم الاقتصادية والتجارية وعلوم التسيير',
                items_ar: JSON.stringify(['العلوم الاقتصادية', 'العلوم التجارية', 'علوم التسيير', 'المحاسبة والمالية']),
                duration_ar: 'نظام LMD',
                display_order: 6
            }
        ];

        const { error } = await supabase.from('specialties').insert(specialties);
        if (error) throw error;
        console.log('Default specialties initialized!');
    }
}

async function initializeDefaultContent() {
    const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .limit(1);

    if (!existing || existing.length === 0) {
        console.log('Seeding default page content...');

        const rows = [];
        const add = (page, section, titleAr, contentAr, type, order) => {
            rows.push({
                page_name: page,
                section_id: section,
                section_title_ar: titleAr,
                content_ar: contentAr,
                content_type: type,
                display_order: order
            });
        };

        // HOME PAGE
        add('home', 'hero_title', 'عنوان البطل',
            'اتحاد الطلبة الموريتانيين بالجزائر',
            'text', 1);
        add('home', 'hero_subtitle', 'العنوان الفرعي',
            'معاً نحو التميز والنجاح في مسيرتنا الأكاديمية',
            'text', 2);
        add('home', 'stats_students', 'إحصائيات - طلاب', '500+', 'text', 3);
        add('home', 'stats_states', 'إحصائيات - ولايات', '15+', 'text', 4);
        add('home', 'stats_majors', 'إحصائيات - تخصصات', '30+', 'text', 5);
        add('home', 'stats_years', 'إحصائيات - سنوات', '10+', 'text', 6);
        add('home', 'about_preview_vision', 'الرؤية',
            'أن نكون الجسر الذي يربط الطلبة الموريتانيين بفرص النجاح والتميز في الجزائر',
            'text', 7);
        add('home', 'about_preview_mission', 'المهمة',
            'توفير الدعم الشامل للطلبة وتسهيل اندماجهم في الحياة الأكاديمية والاجتماعية',
            'text', 8);
        add('home', 'about_preview_values', 'القيم',
            'نؤمن بالتضامن، التميز، الشفافية والعمل الجماعي كقيم أساسية',
            'text', 9);
        add('home', 'cta_title', 'عنوان الدعوة',
            'انضم إلى عائلة اتحاد الطلبة',
            'text', 10);
        add('home', 'cta_text', 'نص الدعوة',
            'سجل الآن واستفد من خدماتنا المتنوعة ودعمنا المستمر طوال مسيرتك الأكاديمية',
            'text', 11);

        // ABOUT PAGE
        add('about', 'history_title', 'عنوان التاريخ',
            'تاريخ الاتحاد', 'text', 1);
        add('about', 'history_content', 'محتوى التاريخ',
            'تأسس اتحاد الطلبة الموريتانيين بالجزائر لخدمة الطلبة الموريتانيين الدارسين في الجزائر، ويسعى منذ تأسيسه إلى توفير بيئة داعمة تساعد الطلبة على التفوق الأكاديمي والاندماج في المجتمع الجزائري.',
            'html', 2);
        add('about', 'vision_title', 'عنوان الرؤية',
            'رؤيتنا', 'text', 3);
        add('about', 'vision_content', 'محتوى الرؤية',
            'أن نكون المرجع الأول والأفضل للطلبة الموريتانيين في الجزائر، ونساهم في بناء جيل متميز من الكفاءات الوطنية.',
            'html', 4);
        add('about', 'mission_title', 'عنوان المهمة',
            'مهمتنا', 'text', 5);
        add('about', 'mission_content', 'محتوى المهمة',
            'تقديم الدعم الشامل للطلبة الموريتانيين في جميع المجالات الأكاديمية والإدارية والاجتماعية.',
            'html', 6);

        // GUIDE PAGE
        add('guide', 'intro_title', 'عنوان الدليل',
            'دليل الطالب الشامل', 'text', 1);
        add('guide', 'intro_text', 'نص مقدمة الدليل',
            'كل ما تحتاج معرفته للحياة والدراسة في الجزائر',
            'text', 2);
        add('guide', 'accordion_bank_title', 'عنوان قسم البنك',
            '\uD83C\uDFE6 فتح حساب بنكي', 'text', 3);
        add('guide', 'accordion_bank', 'محتوى قسم البنك',
            '<h4>الوثائق المطلوبة:</h4><ul><li>جواز السفر ساري المفعول</li><li>شهادة الإقامة أو عقد الإيجار</li><li>شهادة التسجيل الجامعي</li><li>صورتان شمسيتان</li></ul>',
            'html', 4);
        add('guide', 'accordion_transport_title', 'عنوان قسم المواصلات',
            '\uD83D\uDE8C المواصلات والتنقل', 'text', 5);
        add('guide', 'accordion_transport', 'محتوى قسم المواصلات',
            '<h4>وسائل النقل في المدن:</h4><ul><li><strong>المترو:</strong> متوفر في الجزائر العاصمة</li><li><strong>الترامواي:</strong> متوفر في عدة مدن</li><li><strong>الحافلات:</strong> شبكة واسعة تغطي معظم الأحياء</li></ul>',
            'html', 6);
        add('guide', 'accordion_housing_title', 'عنوان قسم السكن',
            '\uD83C\uDFE0 السكن الجامعي', 'text', 7);
        add('guide', 'accordion_housing', 'محتوى قسم السكن',
            '<h4>أنواع السكن:</h4><ul><li><strong>الإقامة الجامعية:</strong> سكن مدعوم من الدولة</li><li><strong>السكن الخاص:</strong> غرف أو شقق للإيجار</li></ul>',
            'html', 8);
        add('guide', 'accordion_documents_title', 'عنوان قسم الوثائق',
            '\uD83D\uDCCB الوثائق المطلوبة', 'text', 9);
        add('guide', 'accordion_documents', 'محتوى قسم الوثائق',
            '<h4>الوثائق الأساسية:</h4><ul><li>جواز السفر ساري المفعول</li><li>شهادة البكالوريا مصدقة ومترجمة</li><li>كشف النقاط مصدق ومترجم</li><li>شهادة الميلاد مصدقة</li></ul>',
            'html', 10);

        // PROGRAMS PAGE
        add('programs', 'intro_title', 'عنوان التخصصات',
            'التخصصات الجامعية', 'text', 1);
        add('programs', 'intro_text', 'نص مقدمة التخصصات',
            'استكشف التخصصات المتاحة للطلبة الموريتانيين في الجامعات الجزائرية',
            'text', 2);

        // SERVICES PAGE
        add('services', 'intro_title', 'عنوان الخدمات',
            'خدمات الاتحاد', 'text', 1);
        add('services', 'intro_text', 'نص مقدمة الخدمات',
            'نقدم مجموعة متنوعة من الخدمات لدعم الطلبة في جميع جوانب حياتهم الأكاديمية',
            'text', 2);
        add('services', 'service_academic_title', 'عنوان الدعم الأكاديمي',
            'الدعم الأكاديمي', 'text', 3);
        add('services', 'service_academic', 'وصف الدعم الأكاديمي',
            'توجيه ومساعدة في اختيار التخصص، والتسجيل، والإجراءات الإدارية الجامعية.',
            'text', 4);
        add('services', 'service_admin_title', 'عنوان المساعدة الإدارية',
            'المساعدة الإدارية', 'text', 5);
        add('services', 'service_admin', 'وصف المساعدة الإدارية',
            'مساعدة في استخراج الوثائق، والإقامة، والتعامل مع الجهات الرسمية.',
            'text', 6);
        add('services', 'service_housing_title', 'عنوان استشارات السكن',
            'استشارات السكن', 'text', 7);
        add('services', 'service_housing', 'وصف استشارات السكن',
            'معلومات ونصائح حول الإقامة الجامعية والسكن الخاص.',
            'text', 8);

        // CONTACT PAGE
        add('contact', 'intro_title', 'عنوان التواصل',
            'تواصل معنا', 'text', 1);
        add('contact', 'intro_text', 'نص مقدمة التواصل',
            'نحن هنا لمساعدتك. لا تتردد في التواصل معنا لأي استفسار',
            'text', 2);
        add('contact', 'email', 'البريد الإلكتروني', 'contact@uema-dz.org', 'text', 3);
        add('contact', 'phone', 'الهاتف', '+213 XX XX XX XX', 'text', 4);
        add('contact', 'address', 'العنوان',
            'الجزائر العاصمة، الجزائر', 'text', 5);
        add('contact', 'hours', 'ساعات العمل',
            'السبت - الخميس: 9:00 - 17:00', 'text', 6);

        const batchSize = 20;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const { error } = await supabase.from('page_content').insert(batch);
            if (error) throw error;
        }

        console.log('Default page content initialized!');
    }
}

async function initializeDefaultSettings() {
    const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1);

    if (!existing || existing.length === 0) {
        const settings = [
            { setting_key: 'site_name', value_ar: 'اتحاد الطلبة والمتدربين الموريتانيين بالجزائر' },
            { setting_key: 'site_description', value_ar: 'منظمة طلابية تهدف لخدمة ودعم الطلبة الموريتانيين في الجزائر' },
            { setting_key: 'footer_text', value_ar: 'جميع الحقوق محفوظة' },
            { setting_key: 'site_logo', value_ar: '', setting_type: 'image' },
            { setting_key: 'site_favicon', value_ar: '', setting_type: 'image' },
            { setting_key: 'contact_email', value_ar: 'contact@uema-dz.org' },
            { setting_key: 'contact_phone', value_ar: '+213 XX XX XX XX' },
            { setting_key: 'contact_address', value_ar: 'الجزائر العاصمة، الجزائر' },
            { setting_key: 'social_facebook', value_ar: '' },
            { setting_key: 'social_instagram', value_ar: '' },
            { setting_key: 'social_telegram', value_ar: '' },
            { setting_key: 'social_whatsapp', value_ar: '' }
        ];

        const { error } = await supabase.from('site_settings').insert(settings);
        if (error) throw error;
        console.log('Default site settings initialized!');
    }
}

async function initializeDefaultUniversities() {
    const { data: existing } = await supabase
        .from('universities')
        .select('id')
        .limit(1);

    if (existing && existing.length > 0) return;

    console.log('Seeding default universities...');

    const unis = [
        // ══════════════════════════════════════════
        // 01 - ولاية أدرار
        // ══════════════════════════════════════════
        { name_ar: 'جامعة أحمد دراية أدرار', wilaya: 'أدرار', website_url: 'https://www.univ-adrar.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 02 - ولاية الشلف
        // ══════════════════════════════════════════
        { name_ar: 'جامعة حسيبة بن بوعلي الشلف', wilaya: 'الشلف', website_url: 'https://www.univ-chlef.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 03 - ولاية الأغواط
        // ══════════════════════════════════════════
        { name_ar: 'جامعة عمار ثليجي الأغواط', wilaya: 'الأغواط', website_url: 'https://www.lagh-univ.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 04 - ولاية أم البواقي
        // ══════════════════════════════════════════
        { name_ar: 'جامعة العربي بن مهيدي أم البواقي', wilaya: 'أم البواقي', website_url: 'https://www.univ-oeb.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 05 - ولاية باتنة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة باتنة 1 الحاج لخضر', wilaya: 'باتنة', website_url: 'https://www.univ-batna.dz', display_order: 1 },
        { name_ar: 'جامعة باتنة 2 مصطفى بن بولعيد', wilaya: 'باتنة', website_url: 'https://www.univ-batna2.dz', display_order: 2 },
        // ══════════════════════════════════════════
        // 06 - ولاية بجاية
        // ══════════════════════════════════════════
        { name_ar: 'جامعة عبد الرحمان ميرة بجاية', wilaya: 'بجاية', website_url: 'https://www.univ-bejaia.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 07 - ولاية بسكرة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة محمد خيضر بسكرة', wilaya: 'بسكرة', website_url: 'https://www.univ-biskra.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 08 - ولاية بشار
        // ══════════════════════════════════════════
        { name_ar: 'جامعة طاهري محمد بشار', wilaya: 'بشار', website_url: 'https://www.univ-bechar.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 09 - ولاية البليدة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة البليدة 1 سعد دحلب', wilaya: 'البليدة', website_url: 'https://www.univ-blida.dz', display_order: 1 },
        { name_ar: 'جامعة البليدة 2 لونيسي علي', wilaya: 'البليدة', website_url: 'https://www.univ-blida2.dz', display_order: 2 },
        // ══════════════════════════════════════════
        // 10 - ولاية البويرة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة أكلي محند أولحاج البويرة', wilaya: 'البويرة', website_url: 'https://www.univ-bouira.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 11 - ولاية تمنراست
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي آمين العقال الحاج موسى أق أخموك تمنراست', wilaya: 'تمنراست', website_url: 'https://www.cu-tamanrasset.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 12 - ولاية تبسة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة العربي التبسي تبسة', wilaya: 'تبسة', website_url: 'https://www.univ-tebessa.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 13 - ولاية تلمسان
        // ══════════════════════════════════════════
        { name_ar: 'جامعة أبو بكر بلقايد تلمسان', wilaya: 'تلمسان', website_url: 'https://www.univ-tlemcen.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 14 - ولاية تيارت
        // ══════════════════════════════════════════
        { name_ar: 'جامعة ابن خلدون تيارت', wilaya: 'تيارت', website_url: 'https://www.univ-tiaret.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 15 - ولاية تيزي وزو
        // ══════════════════════════════════════════
        { name_ar: 'جامعة مولود معمري تيزي وزو', wilaya: 'تيزي وزو', website_url: 'https://www.ummto.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 16 - ولاية الجزائر
        // ══════════════════════════════════════════
        { name_ar: 'جامعة الجزائر 1 بن يوسف بن خدة', wilaya: 'الجزائر', website_url: 'https://www.univ-alger.dz', display_order: 1 },
        { name_ar: 'جامعة الجزائر 2 أبو القاسم سعد الله', wilaya: 'الجزائر', website_url: 'https://www.univ-alger2.dz', display_order: 2 },
        { name_ar: 'جامعة الجزائر 3 إبراهيم سلطان شيبوط', wilaya: 'الجزائر', website_url: 'https://www.univ-alger3.dz', display_order: 3 },
        { name_ar: 'جامعة هواري بومدين للعلوم والتكنولوجيا', wilaya: 'الجزائر', website_url: 'https://www.usthb.dz', display_order: 4 },
        { name_ar: 'المدرسة الوطنية المتعددة التقنيات', wilaya: 'الجزائر', website_url: 'https://www.enp.edu.dz', display_order: 5 },
        { name_ar: 'المدرسة الوطنية العليا للإعلام الآلي', wilaya: 'الجزائر', website_url: 'https://www.esi.dz', display_order: 6 },
        { name_ar: 'المدرسة العليا للأساتذة بالقبة', wilaya: 'الجزائر', website_url: 'https://www.ens-kouba.dz', display_order: 7 },
        { name_ar: 'المدرسة العليا للأساتذة ببوزريعة', wilaya: 'الجزائر', website_url: 'https://ensb.dz', display_order: 8 },
        { name_ar: 'المدرسة الوطنية العليا للفلاحة', wilaya: 'الجزائر', website_url: 'https://www.ensa.dz', display_order: 9 },
        { name_ar: 'المدرسة الوطنية العليا للبيطرة', wilaya: 'الجزائر', website_url: 'https://www.ensv.dz', display_order: 10 },
        { name_ar: 'المدرسة العليا للتجارة', wilaya: 'الجزائر', website_url: 'https://www.esc-alger.dz', display_order: 11 },
        // ══════════════════════════════════════════
        // 17 - ولاية الجلفة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة زيان عاشور الجلفة', wilaya: 'الجلفة', website_url: 'https://www.univ-djelfa.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 18 - ولاية جيجل
        // ══════════════════════════════════════════
        { name_ar: 'جامعة محمد الصديق بن يحيى جيجل', wilaya: 'جيجل', website_url: 'https://www.univ-jijel.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 19 - ولاية سطيف
        // ══════════════════════════════════════════
        { name_ar: 'جامعة سطيف 1 فرحات عباس', wilaya: 'سطيف', website_url: 'https://www.univ-setif.dz', display_order: 1 },
        { name_ar: 'جامعة سطيف 2 محمد لمين دباغين', wilaya: 'سطيف', website_url: 'https://www.univ-setif2.dz', display_order: 2 },
        // ══════════════════════════════════════════
        // 20 - ولاية سعيدة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة الدكتور مولاي الطاهر سعيدة', wilaya: 'سعيدة', website_url: 'https://www.univ-saida.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 21 - ولاية سكيكدة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة 20 أوت 1955 سكيكدة', wilaya: 'سكيكدة', website_url: 'https://www.univ-skikda.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 22 - ولاية سيدي بلعباس
        // ══════════════════════════════════════════
        { name_ar: 'جامعة جيلالي ليابس سيدي بلعباس', wilaya: 'سيدي بلعباس', website_url: 'https://www.univ-sba.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 23 - ولاية عنابة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة باجي مختار عنابة', wilaya: 'عنابة', website_url: 'https://www.univ-annaba.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 24 - ولاية قالمة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة 8 ماي 1945 قالمة', wilaya: 'قالمة', website_url: 'https://www.univ-guelma.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 25 - ولاية قسنطينة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة قسنطينة 1 الإخوة منتوري', wilaya: 'قسنطينة', website_url: 'https://www.umc.edu.dz', display_order: 1 },
        { name_ar: 'جامعة قسنطينة 2 عبد الحميد مهري', wilaya: 'قسنطينة', website_url: 'https://www.univ-constantine2.dz', display_order: 2 },
        { name_ar: 'جامعة قسنطينة 3 صالح بوبنيدر', wilaya: 'قسنطينة', website_url: 'https://www.univ-constantine3.dz', display_order: 3 },
        { name_ar: 'المدرسة العليا للأساتذة بقسنطينة', wilaya: 'قسنطينة', website_url: 'https://www.ens-constantine.dz', display_order: 4 },
        // ══════════════════════════════════════════
        // 26 - ولاية المدية
        // ══════════════════════════════════════════
        { name_ar: 'جامعة يحيى فارس المدية', wilaya: 'المدية', website_url: 'https://www.univ-medea.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 27 - ولاية مستغانم
        // ══════════════════════════════════════════
        { name_ar: 'جامعة عبد الحميد بن باديس مستغانم', wilaya: 'مستغانم', website_url: 'https://www.univ-mosta.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 28 - ولاية المسيلة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة محمد بوضياف المسيلة', wilaya: 'المسيلة', website_url: 'https://www.univ-msila.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 29 - ولاية معسكر
        // ══════════════════════════════════════════
        { name_ar: 'جامعة مصطفى اسطمبولي معسكر', wilaya: 'معسكر', website_url: 'https://www.univ-mascara.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 30 - ولاية ورقلة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة قاصدي مرباح ورقلة', wilaya: 'ورقلة', website_url: 'https://www.univ-ouargla.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 31 - ولاية وهران
        // ══════════════════════════════════════════
        { name_ar: 'جامعة وهران 1 أحمد بن بلة', wilaya: 'وهران', website_url: 'https://www.univ-oran1.dz', display_order: 1 },
        { name_ar: 'جامعة وهران 2 محمد بن أحمد', wilaya: 'وهران', website_url: 'https://www.univ-oran2.dz', display_order: 2 },
        { name_ar: 'جامعة العلوم والتكنولوجيا محمد بوضياف وهران', wilaya: 'وهران', website_url: 'https://www.univ-usto.dz', display_order: 3 },
        { name_ar: 'المدرسة العليا للأساتذة بوهران', wilaya: 'وهران', website_url: 'https://www.ens-oran.dz', display_order: 4 },
        // ══════════════════════════════════════════
        // 32 - ولاية البيض
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي نور البشير البيض', wilaya: 'البيض', website_url: 'https://www.cu-elbayadh.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 33 - ولاية إليزي
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي إليزي', wilaya: 'إليزي', website_url: 'https://www.cu-illizi.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 34 - ولاية برج بوعريريج
        // ══════════════════════════════════════════
        { name_ar: 'جامعة محمد البشير الإبراهيمي برج بوعريريج', wilaya: 'برج بوعريريج', website_url: 'https://www.univ-bba.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 35 - ولاية بومرداس
        // ══════════════════════════════════════════
        { name_ar: 'جامعة أمحمد بوقرة بومرداس', wilaya: 'بومرداس', website_url: 'https://www.univ-boumerdes.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 36 - ولاية الطارف
        // ══════════════════════════════════════════
        { name_ar: 'جامعة الشاذلي بن جديد الطارف', wilaya: 'الطارف', website_url: 'https://www.univ-eltarf.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 37 - ولاية تندوف
        // ══════════════════════════════════════════
        { name_ar: 'جامعة تندوف', wilaya: 'تندوف', website_url: 'https://www.univ-tindouf.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 38 - ولاية تيسمسيلت
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي أحمد بن يحيى الونشريسي تيسمسيلت', wilaya: 'تيسمسيلت', website_url: 'https://www.cuniv-tissemsilt.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 39 - ولاية الوادي
        // ══════════════════════════════════════════
        { name_ar: 'جامعة حمه لخضر الوادي', wilaya: 'الوادي', website_url: 'https://www.univ-eloued.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 40 - ولاية خنشلة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة عباس لغرور خنشلة', wilaya: 'خنشلة', website_url: 'https://www.univ-khenchela.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 41 - ولاية سوق أهراس
        // ══════════════════════════════════════════
        { name_ar: 'جامعة محمد الشريف مساعدية سوق أهراس', wilaya: 'سوق أهراس', website_url: 'https://www.univ-soukahras.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 42 - ولاية تيبازة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة تيبازة', wilaya: 'تيبازة', website_url: 'https://www.univ-tipaza.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 43 - ولاية ميلة
        // ══════════════════════════════════════════
        { name_ar: 'جامعة عبد الحفيظ بوالصوف ميلة', wilaya: 'ميلة', website_url: 'https://www.univ-mila.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 44 - ولاية عين الدفلى
        // ══════════════════════════════════════════
        { name_ar: 'جامعة الجيلالي بونعامة خميس مليانة', wilaya: 'عين الدفلى', website_url: 'https://www.univ-dbkm.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 45 - ولاية النعامة
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي صالحي أحمد النعامة', wilaya: 'النعامة', website_url: 'https://www.cu-naama.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 46 - ولاية عين تموشنت
        // ══════════════════════════════════════════
        { name_ar: 'جامعة بلحاج بوشعيب عين تموشنت', wilaya: 'عين تموشنت', website_url: 'https://www.univ-temouchent.edu.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 47 - ولاية غرداية
        // ══════════════════════════════════════════
        { name_ar: 'جامعة غرداية', wilaya: 'غرداية', website_url: 'https://www.univ-ghardaia.edu.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 48 - ولاية غليزان
        // ══════════════════════════════════════════
        { name_ar: 'جامعة أحمد زبانة غليزان', wilaya: 'غليزان', website_url: 'https://www.univ-relizane.dz', display_order: 1 },
        // ══════════════════════════════════════════
        // 49 - ولاية تيميمون
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي تيميمون', wilaya: 'تيميمون', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 50 - ولاية برج باجي مختار
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي برج باجي مختار', wilaya: 'برج باجي مختار', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 51 - ولاية أولاد جلال
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي أولاد جلال', wilaya: 'أولاد جلال', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 52 - ولاية بني عباس
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي بني عباس', wilaya: 'بني عباس', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 53 - ولاية عين صالح
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي عين صالح', wilaya: 'عين صالح', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 54 - ولاية عين قزام
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي عين قزام', wilaya: 'عين قزام', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 55 - ولاية توقرت
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي توقرت', wilaya: 'توقرت', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 56 - ولاية جانت
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي جانت', wilaya: 'جانت', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 57 - ولاية المغير
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي المغير', wilaya: 'المغير', website_url: '', display_order: 1 },
        // ══════════════════════════════════════════
        // 58 - ولاية المنيعة
        // ══════════════════════════════════════════
        { name_ar: 'المركز الجامعي المنيعة', wilaya: 'المنيعة', website_url: '', display_order: 1 },
    ];

    const batchSize = 20;
    for (let i = 0; i < unis.length; i += batchSize) {
        const batch = unis.slice(i, i + batchSize);
        const { error } = await supabase.from('universities').insert(batch);
        if (error) throw error;
    }

    console.log('Default universities initialized! (' + unis.length + ' universities)');
}

async function ensureTablesExist() {
    const requiredTables = ['admins', 'news', 'messages', 'page_content', 'hero_slides', 'specialties', 'site_settings', 'gallery', 'universities'];

    const missingTables = [];
    for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });
        if (error && (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation'))) {
            missingTables.push(table);
        }
    }

    if (missingTables.length === 0) {
        console.log('All tables exist — skipping schema creation');
        return;
    }

    throw new Error(
        'Missing tables: ' + missingTables.join(', ') + '. ' +
        'Please run the SQL migration in the Supabase SQL Editor.'
    );
}

async function ensureStorageBucket() {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw new Error('Failed to list storage buckets: ' + listError.message);

    const existing = buckets.find(b => b.name === 'uploads');
    if (!existing) {
        const { error: createError } = await supabase.storage.createBucket('uploads', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        if (createError) throw new Error('Failed to create storage bucket: ' + createError.message);
        console.log('Storage bucket "uploads" created (public)');
    } else {
        await supabase.storage.updateBucket('uploads', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        console.log('Storage bucket "uploads" verified');
    }
}

function getClient() {
    if (!supabase) {
        throw new Error('Database not connected yet. Please try again in a moment.');
    }
    return supabase;
}

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

async function forceReseed() {
    if (!supabase) throw new Error('Database not connected.');
    await supabase.from('admins').delete().eq('username', 'admin');
    await supabase.from('page_content').delete().neq('id', 0);
    await supabase.from('specialties').delete().neq('id', 0);
    await supabase.from('site_settings').delete().neq('id', 0);
    await createDefaultAdmin();
    await initializeDefaultSpecialties();
    await initializeDefaultContent();
    await initializeDefaultSettings();
    return await getSeedStatus();
}

module.exports = {
    initializeDatabase,
    getSeedStatus,
    forceReseed,
    getClient
};
